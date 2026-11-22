import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import worker from '../../server/worker.js';
import { openDatabase } from '../../server/local-db.js';

test('o módulo inicial monta a home no navegador', async (t) => {
  const dom = new JSDOM('<div id="app"></div>', { url: 'https://compasso.test/' });
  t.after(() => dom.window.close());
  globalThis.window = dom.window;
  t.after(() => { delete globalThis.window; });
  await import('../../src/main.js');
  assert.ok(dom.window.document.querySelector('main a[href="/explorar"]'));
});

test('o Worker serve a home pelo binding ASSETS', async () => {
  const env = { ASSETS: { fetch(request) {
    assert.equal(new URL(request.url).pathname, '/index.html');
    return new Response('<title>Compasso</title>');
  } } };
  const response = await worker.fetch(new Request('https://compasso.test/'), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '<title>Compasso</title>');
});

test('o Worker consulta os artistas publicados pelo binding DB', async (t) => {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  const request = new Request('https://compasso.test/api/artists');
  const response = await worker.fetch(request, { DB: db });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});
