import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../../server/http.js';
import { openDatabase } from '../../server/local-db.js';

const mensagem = { email: 'ana@example.test', message: 'Como falo com a equipe?' };

function banco(t) {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  return db;
}

function chamar(db, rota, dados, ip = '192.0.2.1') {
  const request = new Request('https://compasso.test/api/' + rota, {
    method: dados === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return handleRequest(request, () => assert.fail('A API buscou um arquivo estático'), db, ip);
}

function total(db) {
  return db.prepare('SELECT COUNT(*) AS n FROM team_messages').first().n;
}

test('contato anônimo confirma a gravação do texto e do e-mail sem espaços nas pontas', async t => {
  const db = banco(t);
  const resposta = await chamar(db, 'contact', { email: '  ana@example.test  ', message: '  Olá, equipe!  ' });
  assert.equal(resposta.status, 201);
  assert.deepEqual(await resposta.json(), { ok: true });
  const linha = db.prepare('SELECT * FROM team_messages').first();
  assert.equal(linha.email, mensagem.email);
  assert.equal(linha.message, 'Olá, equipe!');
  assert.ok(linha.id);
  assert.equal(new Date(linha.created_at).toISOString(), linha.created_at);
  assert.equal(total(db), 1);
});

test('contato recusa e-mail inválido e mensagem vazia ou longa e aceita os limites exatos', async t => {
  const db = banco(t);
  const email = 'a'.repeat(241) + '@example.test';
  for (const campos of [{ email: 'ana@' }, { email: 'a' + email }, { message: 12 },
    { message: '   ' }, { message: 'a'.repeat(2001) }]) {
    assert.equal((await chamar(db, 'contact', { ...mensagem, ...campos })).status, 400);
  }
  assert.equal(total(db), 0);
  assert.equal((await chamar(db, 'contact', { email, message: 'a'.repeat(2000) })).status, 201);
});

test('a API pública aceita envio de contato e não oferece leitura das mensagens', async t => {
  const db = banco(t);
  assert.equal((await chamar(db, 'contact', mensagem)).status, 201);
  const resposta = await chamar(db, 'contact');
  assert.equal(resposta.status, 405);
  assert.equal(resposta.headers.get('Allow'), 'POST');
  assert.deepEqual(Object.keys(await resposta.json()), ['error']);
  assert.equal((await chamar(db, 'team_messages')).status, 404);
  assert.deepEqual(await (await chamar(db, 'artists')).json(), []);
});

test('oito envios simultâneos por IP são aceitos e o excedente não grava mensagem', async t => {
  const db = banco(t);
  const respostas = await Promise.all(Array.from({ length: 9 }, () => chamar(db, 'contact', mensagem)));
  assert.deepEqual(respostas.map(r => r.status).sort(), [...Array(8).fill(201), 429]);
  const bloqueada = respostas.find(r => r.status === 429);
  const segundos = Number(bloqueada.headers.get('Retry-After'));
  assert.ok(segundos > 0 && segundos <= 600);
  assert.equal(total(db), 8);
  assert.equal((await chamar(db, 'contact', mensagem, '192.0.2.2')).status, 201);
});

test('a janela dura dez minutos e envios bloqueados não adiam a reabertura', async t => {
  const db = banco(t);
  const inicio = 1800000000000;
  t.mock.timers.enable({ apis: ['Date'], now: inicio });
  for (let i = 0; i < 8; i++) assert.equal((await chamar(db, 'contact', mensagem)).status, 201);
  t.mock.timers.tick(599999);
  const ultima = await chamar(db, 'contact', mensagem);
  assert.equal(ultima.status, 429);
  assert.equal(ultima.headers.get('Retry-After'), '1');
  t.mock.timers.tick(1);
  assert.equal((await chamar(db, 'contact', mensagem)).status, 201);
  assert.equal(total(db), 9);
});

test('cadastro e login têm cotas independentes de 15 tentativas por e-mail normalizado', async t => {
  const db = banco(t);
  for (const [rota, esperado] of [['register', 400], ['login', 401]]) {
    for (let i = 0; i < 15; i++) {
      assert.equal((await chamar(db, rota, { email: mensagem.email })).status, esperado);
    }
    const excesso = await chamar(db, rota, { email: ' ANA@Example.Test ' }, '192.0.2.2');
    assert.equal(excesso.status, 429);
    assert.equal(excesso.headers.get('Set-Cookie'), null);
  }
});

test('limita cadastro a 35 e login a 80 tentativas por IP mesmo com e-mails distintos', async t => {
  const db = banco(t);
  for (const [rota, limite, esperado] of [['register', 35, 400], ['login', 80, 401]]) {
    for (let i = 0; i < limite; i++) {
      const dados = { email: 'conta' + i + '@example.test' };
      assert.equal((await chamar(db, rota, dados)).status, esperado);
    }
    assert.equal((await chamar(db, rota, { email: mensagem.email })).status, 429);
  }
  assert.equal((await chamar(db, 'contact', mensagem)).status, 201);
});
