import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../../server/local-db.js';
import { handleRequest } from '../../server/http.js';
import { activeArtist, verifyPassword } from '../../server/auth.js';

const contaValida = {
  fullName: 'Ana da Silva',
  name: 'Ana Cordas',
  email: 'ana@example.test',
  password: 'ensaio-1!',
  slug: 'ana-cordas',
};

function cadastrar(db, dados) {
  const request = new Request('https://compasso.test/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  function fetchAsset() {
    assert.fail('O cadastro foi encaminhado para os arquivos estáticos');
  }

  return handleRequest(request, fetchAsset, db);
}

test('cadastro grava o artista e abre uma sessão para a mesma conta', async (t) => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());

  const response = await cadastrar(db, contaValida);

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });

  const artista = await db.prepare(
    'SELECT id, slug, password_hash, draft FROM artists WHERE email = ?'
  ).bind(contaValida.email).first();

  assert.ok(artista, 'o cadastro deve gravar o artista no banco');
  assert.equal(artista.slug, contaValida.slug);
  assert.equal(JSON.parse(artista.draft).profile.name, contaValida.name);
  assert.notEqual(artista.password_hash, contaValida.password);
  assert.equal(await verifyPassword(contaValida.password, artista.password_hash), true);

  const cookie = response.headers.get('Set-Cookie');
  assert.ok(cookie, 'o cadastro deve devolver o cookie da sessão');

  const proximaRequisicao = new Request('https://compasso.test/', {
    headers: { Cookie: cookie.split(';')[0] },
  });

  const artistaDaSessao = await activeArtist(db, proximaRequisicao);
  assert.equal(artistaDaSessao?.id, artista.id);
});

test('recusa e-mail ou slug duplicado sem criar outro artista ou sessão', async (t) => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());

  const primeiraResposta = await cadastrar(db, contaValida);
  assert.equal(primeiraResposta.status, 201);

  const emailRepetido = await cadastrar(db, {
    ...contaValida,
    email: ' ANA@example.test ',
    slug: 'outro-slug',
  });
  assert.equal(emailRepetido.status, 409);
  assert.equal(emailRepetido.headers.get('Set-Cookie'), null);

  const slugRepetido = await cadastrar(db, {
    ...contaValida,
    email: 'outra@example.test',
  });
  assert.equal(slugRepetido.status, 409);
  assert.equal(slugRepetido.headers.get('Set-Cookie'), null);

  const artistas = await db.prepare('SELECT COUNT(*) AS total FROM artists').first();
  const sessoes = await db.prepare('SELECT COUNT(*) AS total FROM sessions').first();

  assert.equal(artistas.total, 1);
  assert.equal(sessoes.total, 1);
});

test('API aplica os limites de senha e exige símbolo nos novos cadastros', async t => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  const cases = [['a'.repeat(7) + '!', 400], ['a'.repeat(8) + '@', 201],
    ['a'.repeat(127) + '#', 201], ['a'.repeat(128) + '!', 400], ['abcdefghi', 400]];
  for (const [index, [password, status]] of cases.entries()) {
    const resposta = await cadastrar(db, { ...contaValida, password, slug: 'ana-' + index, email: `ana${index}@example.test` });
    assert.equal(resposta.status, status, 'caso ' + index);
  }
});
