import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { hashPassword } from '../../server/auth.js';
import { openDatabase } from '../../server/local-db.js';
import { handleRequest } from '../../server/http.js';

const conta = {
  fullName: 'Ana da Silva',
  name: 'Ana Cordas',
  email: 'ana@example.test',
  password: 'ensaio-1!',
  slug: 'ana-cordas',
};
const credenciais = { email: conta.email, password: conta.password };

function abrirBanco(t) {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  return db;
}

function requisitar(db, rota, { dados, cookie } = {}) {
  const headers = new Headers();
  if (cookie) headers.set('Cookie', cookie);
  if (dados !== undefined) headers.set('Content-Type', 'application/json');

  const request = new Request(`https://compasso.test/api/${rota}`, {
    method: dados === undefined ? 'GET' : 'POST',
    headers,
    body: JSON.stringify(dados),
  });
  return handleRequest(request, () => assert.fail('A rota da API tentou buscar um arquivo'), db);
}

function cookieEmitido(response, status) {
  assert.equal(response.status, status);
  const header = response.headers.get('Set-Cookie');
  assert.match(header ?? '', /^compasso_session=[0-9a-f]{64};/);
  return header.split(';')[0];
}

async function cadastrar(db) {
  return cookieEmitido(await requisitar(db, 'register', { dados: conta }), 201);
}

async function consultar(db, cookie) {
  const response = await requisitar(db, 'session', { cookie });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  return response.json();
}

test('visitante e cookie desconhecido recebem sessão nula', async (t) => {
  const db = abrirBanco(t);
  assert.equal(await consultar(db), null);
  assert.equal(await consultar(db, 'compasso_session=invalido'), null);
  assert.equal(await consultar(db, 'compasso_session=' + 'a'.repeat(64)), null);
});

test('cookie de cadastro devolve apenas o estado do artista', async (t) => {
  const db = abrirBanco(t);
  const cookie = await cadastrar(db);
  const artista = await db.prepare('SELECT id, draft FROM artists WHERE slug = ?')
    .bind(conta.slug).first();

  assert.deepEqual(await consultar(db, cookie), {
    ...JSON.parse(artista.draft),
    id: artista.id,
    slug: conta.slug,
    revision: 0,
    publication: null,
  });
});

test('senha incorreta e e-mail desconhecido recebem o mesmo 401', async (t) => {
  const db = abrirBanco(t);
  await cadastrar(db);
  for (const dados of [
    { ...credenciais, password: 'outra-senha!' },
    { ...credenciais, email: 'ausente@example.test' },
  ]) {
    const resposta = await requisitar(db, 'login', { dados });
    assert.equal(resposta.status, 401);
    assert.deepEqual(await resposta.json(), { error: 'E-mail ou senha incorretos.' });
    assert.equal(resposta.headers.get('Set-Cookie'), null);
  }
  const sessoes = await db.prepare('SELECT COUNT(*) AS total FROM sessions').first();
  assert.equal(sessoes.total, 1);
});

test('o cookie deixa de identificar o artista quando a sessão expira no banco', async (t) => {
  const db = abrirBanco(t);
  const cookie = await cadastrar(db);
  assert.equal((await consultar(db, cookie)).slug, conta.slug);

  await db.prepare('UPDATE sessions SET expires = ?').bind(Date.now() - 1000).run();

  assert.equal(await consultar(db, cookie), null);
});

test('logout invalida o cookie e um novo login recupera a mesma conta e o rascunho salvo', async (t) => {
  const db = abrirBanco(t);
  const anterior = await cadastrar(db);
  const artista = await db.prepare('SELECT id, draft FROM artists WHERE slug = ?')
    .bind(conta.slug).first();
  const draft = JSON.parse(artista.draft);
  draft.profile.instrument = 'Viola de arco';
  await db.prepare('UPDATE artists SET draft = ?, revision = revision + 1 WHERE id = ?')
    .bind(JSON.stringify(draft), artista.id).run();
  const estado = await consultar(db, anterior);
  assert.equal(estado.profile.instrument, 'Viola de arco');

  const saida = await requisitar(db, 'logout', { dados: {}, cookie: anterior });
  assert.equal(saida.status, 200);
  assert.deepEqual(await saida.json(), { ok: true });
  const limparCookie = saida.headers.get('Set-Cookie') ?? '';
  assert.match(limparCookie, /^compasso_session=;/);
  assert.ok(limparCookie.split('; ').includes('Max-Age=0'));
  assert.equal(await consultar(db, anterior), null);

  const entrada = await requisitar(db, 'login', {
    dados: { ...credenciais, email: ' ANA@example.test ' },
  });
  const novo = cookieEmitido(entrada, 200);
  assert.deepEqual(await entrada.json(), { ok: true });
  assert.notEqual(novo, anterior);
  assert.deepEqual(await consultar(db, novo), estado);
});

test('trocar ou encerrar uma sessão preserva a de outro navegador', async (t) => {
  const db = abrirBanco(t);
  const anterior = await cadastrar(db);
  const outro = cookieEmitido(await requisitar(db, 'login', { dados: credenciais }), 200);
  const novo = cookieEmitido(await requisitar(db, 'login', {
    dados: credenciais,
    cookie: anterior,
  }), 200);

  assert.notEqual(novo, anterior);
  assert.equal(await consultar(db, anterior), null);
  assert.equal((await consultar(db, novo)).slug, conta.slug);
  assert.equal((await consultar(db, outro)).slug, conta.slug);

  const saida = await requisitar(db, 'logout', { dados: {}, cookie: novo });
  assert.equal(saida.status, 200);
  assert.equal(await consultar(db, novo), null);
  assert.equal((await consultar(db, outro)).slug, conta.slug);
});

test('login e logout exigem POST e a consulta de sessão exige GET', async (t) => {
  const db = abrirBanco(t);
  for (const rota of ['login', 'logout']) {
    const resposta = await requisitar(db, rota);
    assert.equal(resposta.status, 405);
    assert.equal(resposta.headers.get('Allow'), 'POST');
  }
  const resposta = await requisitar(db, 'session', { dados: {} });
  assert.equal(resposta.status, 405);
  assert.equal(resposta.headers.get('Allow'), 'GET');
});

test('reabrir o SQLite recupera o rascunho e mantém as duas contas independentes', async (t) => {
  const pasta = await mkdtemp(join(tmpdir(), 'compasso-persistencia-'));
  const arquivo = join(pasta, 'compasso.sqlite');
  let db;
  t.after(async () => {
    db?.close();
    await rm(pasta, { recursive: true, force: true });
  });
  db = openDatabase(arquivo);

  const bia = { ...conta, fullName: 'Bia Lopes', name: 'Bia', email: 'bia@example.test', slug: 'bia' };
  const cookieAna = await cadastrar(db);
  const cookieBia = cookieEmitido(await requisitar(db, 'register', { dados: bia }), 201);
  const estadoBia = await consultar(db, cookieBia);
  const ana = await consultar(db, cookieAna);
  assert.notEqual(ana.id, estadoBia.id);

  ana.profile.instrument = 'Viola de arco';
  ana.works.push({ id: 'w1', title: 'Quarteto', url: 'https://example.test/quarteto' });
  ana.events.push({ id: 'e1', title: 'Recital', venue: 'Teatro', date: '2026-11-24', time: '19:00' });
  const resposta = await requisitar(db, 'draft', { dados: ana, cookie: cookieAna });
  assert.equal(resposta.status, 200);
  const esperado = { ...ana, revision: ana.revision + 1 };
  assert.deepEqual(await resposta.json(), esperado);

  db.close();
  db = undefined;
  db = openDatabase(arquivo);

  for (const [artista, anterior, estado] of [[conta, cookieAna, esperado], [bia, cookieBia, estadoBia]]) {
    const dados = { email: artista.email, password: artista.password };
    const novo = cookieEmitido(await requisitar(db, 'login', { dados }), 200);
    assert.notEqual(novo, anterior);
    assert.deepEqual(await consultar(db, novo), estado);
  }
});

test('conta antiga com senha de oito caracteres continua entrando', async t => {
  const db = abrirBanco(t);
  await cadastrar(db);
  const password = 'abcdefg!';
  await db.prepare('UPDATE artists SET password_hash = ? WHERE email = ?')
    .bind(await hashPassword(password), conta.email).run();
  const response = await requisitar(db, 'login', { dados: { email: conta.email, password } });
  const cookie = cookieEmitido(response, 200);
  assert.equal((await consultar(db, cookie)).slug, conta.slug);
});
