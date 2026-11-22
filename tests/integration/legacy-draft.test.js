import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../../src/data/repository.js';
import { newDraft } from '../../src/domain/account.js';
import { openDatabase } from '../../server/local-db.js';
import { handleRequest } from '../../server/http.js';

test('importar muda apenas o rascunho e uma revisão antiga recebe conflito sem sobrescrever', async t => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  let cookie = '';
  const chamar = (rota, dados) => handleRequest(new Request('https://compasso.test/api/' + rota, {
    method: dados === undefined ? 'GET' : 'POST',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  }), () => assert.fail('API buscou arquivo estático'), db);

  const registro = await chamar('register', {
    fullName: 'Ana Silva', name: 'Ana', slug: 'ana-viola', email: 'ana@example.test', password: 'concerto!',
  });
  assert.equal(registro.status, 201);
  cookie = registro.headers.get('Set-Cookie').split(';')[0];
  const inicial = await (await chamar('session')).json();
  inicial.profile.instrument = 'Viola';
  const salvo = await chamar('draft', inicial);
  assert.equal(salvo.status, 200);
  const publicar = await chamar('publish', await salvo.json());
  assert.equal(publicar.status, 200);
  const antes = await publicar.json();
  const legado = newDraft('Nome no computador');
  legado.works.push({ id: 'w1', title: 'Quarteto', url: 'https://example.test/quarteto' });
  legado.events.push({ id: 'e1', title: 'Ensaio', date: '2026-11-24', time: '19:00', venue: 'Sala' });
  const raw = JSON.stringify({ ...legado, id: 'outra', revision: 99, publication: { slug: 'outra' } });
  const repo = createRepository({ getItem: key => key === 'compasso-v2' ? raw : null });
  const importar = () => repo.importDraft(antes, {
    confirm: () => true,
    save: async dados => {
      const response = await chamar('draft', dados);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    },
  });

  const depois = await importar();
  assert.deepEqual(depois, { ...antes, ...legado, revision: antes.revision + 1 });
  assert.deepEqual(await (await chamar('artists')).json(), [antes.publication]);
  await assert.rejects(importar(), /HTTP 409/);
  assert.deepEqual(await (await chamar('session')).json(), depois);
  assert.equal(repo.load().state.profile.name, legado.profile.name);
});
