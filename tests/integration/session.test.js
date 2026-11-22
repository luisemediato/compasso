import test from 'node:test';
import assert from 'node:assert/strict';
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
