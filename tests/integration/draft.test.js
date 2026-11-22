import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../../server/local-db.js';
import { handleRequest } from '../../server/http.js';

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
  return handleRequest(request, () => assert.fail('Rota desviada para assets'), db);
}

async function conta(db, slug) {
  const registro = await chamar(db, 'register', '', {
    fullName: 'Nome privado', name: slug, slug,
    email: slug + '@example.test', password: 'ensaio-1!',
  });
  assert.equal(registro.status, 201);
  const cookie = registro.headers.get('Set-Cookie').split(';')[0];
  const ler = async () => (await chamar(db, 'session', cookie)).json();
  const salvar = dados => chamar(db, 'draft', cookie, dados);
  return { ler, salvar };
}

test('visitante recebe 401 ao salvar rascunho', async (t) => {
  assert.equal((await chamar(banco(t), 'draft', '', {})).status, 401);
});

test('salva perfil, trabalhos e eventos, normaliza Instagram e permite removê-lo', async (t) => {
  const artista = await conta(banco(t), 'ana');
  const estado = await artista.ler();
  estado.profile.instagram = '@Ana.Viola';
  estado.profile.bio = 'Viola de arco';
  estado.works.push({ id: 'obra-1', title: 'Concerto', url: 'https://example.test/concerto' });
  estado.events.push({ id: 'evento-1', title: 'Recital' });
  const resposta = await artista.salvar(estado);
  assert.equal(resposta.status, 200);
  const salvo = await resposta.json();
  assert.deepEqual(salvo, {
    ...estado, revision: estado.revision + 1,
    profile: { ...estado.profile, instagram: 'https://www.instagram.com/ana.viola/' },
  });
  assert.deepEqual(await artista.ler(), salvo);
  salvo.profile.instagram = '';
  assert.equal((await artista.salvar(salvo)).status, 200);
  assert.equal((await artista.ler()).profile.instagram, '');
});

test('uma conta não pode gravar no rascunho de outra', async (t) => {
  const db = banco(t);
  const ana = await conta(db, 'ana');
  const bia = await conta(db, 'bia');
  const inicialAna = await ana.ler();
  const inicialBia = await bia.ler();
  const tentativa = { ...inicialBia, profile: { ...inicialBia.profile, bio: 'Alterada' } };
  assert.equal((await ana.salvar(tentativa)).status, 409);
  assert.deepEqual(await ana.ler(), inicialAna);
  assert.deepEqual(await bia.ler(), inicialBia);
});

test('duas abas com a mesma revisão produzem um salvamento e um conflito', async (t) => {
  const artista = await conta(banco(t), 'ana');
  const a = await artista.ler();
  const b = await artista.ler();
  a.profile.bio = 'Primeira aba';
  b.profile.bio = 'Segunda aba';
  const respostas = await Promise.all([artista.salvar(a), artista.salvar(b)]);
  assert.deepEqual(respostas.map(r => r.status).sort(), [200, 409]);
  const indice = respostas.findIndex(r => r.status === 200);
  const atual = await artista.ler();
  assert.equal(atual.revision, a.revision + 1);
  assert.equal(atual.profile.bio, [a, b][indice].profile.bio);
});

test('rascunho inválido não altera dados nem consome revisão', async (t) => {
  const artista = await conta(banco(t), 'ana');
  const inicial = await artista.ler();
  const resposta = await artista.salvar({
    ...inicial, profile: { ...inicial.profile, instagram: 'https://example.test/ana' },
  });
  assert.equal(resposta.status, 400);
  assert.deepEqual(await artista.ler(), inicial);
});
