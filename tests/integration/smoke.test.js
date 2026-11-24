import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyDeployment } from '../../scripts/smoke.js';

function asset(url) {
  const path = url.pathname;
  if (path === '/api/artists') return Response.json([]);
  if (path.endsWith('.css')) return new Response('* { box-sizing: border-box; }', { headers: { 'Content-Type': 'text/css' } });
  if (path.endsWith('.js')) return new Response('"Compasso"', { headers: { 'Content-Type': 'text/javascript' } });
  return new Response('<div id="app"></div>', { headers: { 'Content-Type': 'text/html' } });
}

test('smoke lê home, CSS, JS, catálogo e rota direta no mesmo site', async () => {
  const paths = [];
  const results = await verifyDeployment('https://compasso.example', { directPath: '/musico', fetcher: async (url, options) => {
    assert.equal(url.origin, 'https://compasso.example');
    assert.equal(options.method, undefined);
    paths.push(url.pathname);
    return asset(url);
  } });
  assert.deepEqual(paths, ['/', '/assets/main.css', '/assets/main.js', '/api/artists', '/musico']);
  assert.equal(results.length, 5);
});

test('smoke reprova status, conteúdo, MIME e catálogo inválidos', async () => {
  for (const response of [new Response('', { status: 404 }), new Response('errado', { headers: { 'Content-Type': 'text/html' } }), new Response('<div id="app"></div>')]) {
    await assert.rejects(verifyDeployment('https://compasso.example', { fetcher: async () => response }));
  }
  await assert.rejects(verifyDeployment('https://compasso.example', { fetcher: async url => url.pathname === '/api/artists' ? Response.json({ error: 'indisponível' }) : asset(url) }));
});

test('smoke exige o SHA aprovado quando a revisão esperada é informada', async () => {
  const fetcher = async url => url.pathname === '/version.json' ? Response.json({ revision: 'sha-aprovado' }) : asset(url);
  const results = await verifyDeployment('https://compasso.example', { fetcher, expectedRevision: 'sha-aprovado' });
  assert.equal(results.at(-1).revision, 'sha-aprovado');
  await assert.rejects(verifyDeployment('https://compasso.example', { fetcher, expectedRevision: 'outro-sha' }), /commit publicado/);
});
