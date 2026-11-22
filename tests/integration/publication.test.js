import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../../server/http.js';
import { openDatabase } from '../../server/local-db.js';

function banco(t) {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  return db;
}

function chamar(db, rota, cookie, dados) {
  const request = new Request('https://compasso.test/api/' + rota, {
    method: dados === undefined ? 'GET' : 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return handleRequest(request, () => assert.fail('A API buscou um arquivo estático'), db);
}

async function sucesso(resposta) {
  const body = await resposta.json();
  assert.equal(resposta.status, 200, JSON.stringify(body));
  return body;
}

async function conta(db, slug = 'ana') {
  const registro = await chamar(db, 'register', '', {
    fullName: 'Nome civil', name: slug, slug, email: slug + '@example.test', password: 'ensaio-1!',
  });
  assert.equal(registro.status, 201);
  const cookie = registro.headers.get('Set-Cookie').split(';')[0];
  return (rota, dados) => chamar(db, rota, cookie, dados);
}

function versao({ id, revision }) {
  return { id, revision };
}

async function preparar(artista) {
  const estado = await sucesso(await artista('session'));
  const evento = { id: 'e1', title: 'Recital', venue: 'Sala', time: '19:00', date: '2026-11-24' };
  estado.profile.instrument = 'Viola';
  estado.events = [
    { ...evento, visibility: 'public' },
    { ...evento, id: 'e2', title: 'Ensaio', visibility: 'private' },
    { ...evento, id: 'e3', title: 'Evento antigo' },
  ];
  return sucesso(await artista('draft', estado));
}

test('publicar e retirar exigem sessão e método POST', async (t) => {
  const db = banco(t);
  for (const rota of ['publish', 'unpublish']) {
    assert.equal((await chamar(db, rota, '', {})).status, 401);
    const get = await chamar(db, rota, '');
    assert.equal(get.status, 405);
    assert.equal(get.headers.get('Allow'), 'POST');
  }
});

test('perfil incompleto retorna 400 sem criar publicação ou consumir revisão', async (t) => {
  const artista = await conta(banco(t));
  const antes = await sucesso(await artista('session'));
  const resposta = await artista('publish', versao(antes));
  assert.equal(resposta.status, 400);
  assert.match((await resposta.json()).error, /instrumento/i);
  assert.deepEqual(await sucesso(await artista('session')), antes);
});

test('publica a versão salva, filtra a agenda e só troca a cópia ao republicar', async (t) => {
  const artista = await conta(banco(t));
  const salvo = await preparar(artista);
  const primeira = await sucesso(await artista('publish', {
    ...versao(salvo), slug: 'outra-conta', profile: { name: 'Outro nome' }, events: [],
  }));
  assert.equal(primeira.revision, salvo.revision + 1);
  assert.equal(primeira.publication.slug, salvo.slug);
  assert.deepEqual(primeira.publication.profile, salvo.profile);
  assert.deepEqual(primeira.publication.events, [salvo.events[0]]);
  assert.deepEqual(await sucesso(await artista('session')), primeira);

  primeira.events[0].visibility = 'private';
  primeira.profile.city = 'Ouro Preto';
  const editado = await sucesso(await artista('draft', primeira));
  assert.deepEqual(editado.publication, primeira.publication);
  const segunda = await sucesso(await artista('publish', versao(editado)));
  assert.equal(segunda.publication.profile.city, 'Ouro Preto');
  assert.deepEqual(segunda.publication.events, []);
  assert.deepEqual(segunda.events, editado.events);
});

test('retirar limpa a publicação e preserva o rascunho para publicar de novo', async (t) => {
  const artista = await conta(banco(t));
  const salvo = await preparar(artista);
  const publicada = await sucesso(await artista('publish', versao(salvo)));
  const retirada = await sucesso(await artista('unpublish', versao(publicada)));
  assert.deepEqual(retirada, { ...publicada, publication: null, revision: publicada.revision + 1 });
  assert.deepEqual(await sucesso(await artista('session')), retirada);
  const restaurada = await sucesso(await artista('publish', versao(retirada)));
  assert.deepEqual(restaurada.publication.events, publicada.publication.events);
});

test('uma conta não publica nem retira o portfólio de outra', async (t) => {
  const db = banco(t);
  const ana = await conta(db);
  const bia = await conta(db, 'bia');
  const antes = await preparar(ana);
  const dela = await preparar(bia);
  for (const rota of ['publish', 'unpublish']) {
    assert.equal((await bia(rota, versao(antes))).status, 409);
  }
  assert.deepEqual(await sucesso(await ana('session')), antes);
  assert.deepEqual(await sucesso(await bia('session')), dela);
});

test('duas abas na mesma revisão só alteram a publicação uma vez', async (t) => {
  const artista = await conta(banco(t));
  const salvo = await preparar(artista);
  const respostas = await Promise.all([artista('publish', versao(salvo)), artista('publish', versao(salvo))]);
  assert.deepEqual(respostas.map(r => r.status).sort(), [200, 409]);
  const vencedora = await sucesso(respostas.find(r => r.status === 200));
  assert.equal(vencedora.revision, salvo.revision + 1);
  assert.equal((await artista('unpublish', versao(salvo))).status, 409);
  assert.deepEqual(await sucesso(await artista('session')), vencedora);
});
