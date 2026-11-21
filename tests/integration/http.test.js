import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../../server/http.js';

const files = new Map([
  ['/index.html', '<title>Compasso</title>'],
  ['/assets/main.css', 'body { margin: 0; }'],
]);

async function fetchAsset(request) {
  const path = new URL(request.url).pathname;
  if (!files.has(path)) return new Response(null, { status: 404 });

  const type = path.endsWith('.css') ? 'text/css' : 'text/html';
  return new Response(files.get(path), { headers: { 'Content-Type': type } });
}

function request(path, method = 'GET') {
  return handleRequest(new Request(`http://localhost${path}`, { method }), fetchAsset);
}

test('GET da home entrega o HTML da aplicação', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Compasso/);
});

test('abrir uma rota diretamente também entrega a aplicação', async () => {
  const response = await request('/explorar');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Compasso/);
});

test('GET do CSS preserva o tipo e o conteúdo', async () => {
  const response = await request('/assets/main.css');
  assert.match(response.headers.get('content-type'), /text\/css/);
  assert.match(await response.text(), /margin/);
});

test('HEAD retorna os cabeçalhos e um corpo vazio', async () => {
  const response = await request('/assets/main.css', 'HEAD');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/css/);
  assert.equal(await response.text(), '');
});

test('arquivo ausente retorna 404', async () => {
  assert.equal((await request('/assets/ausente.css')).status, 404);
});
