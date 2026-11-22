import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../../server/http.js';
import { openDatabase } from '../../server/local-db.js';

const url = 'https://compasso.test/api/logout';
const limite = 400_000;

async function enviar(t, { method = 'POST', headers = {}, body = '{}' } = {}) {
  const db = openDatabase(':memory:');
  t.after(() => db.close());
  const request = new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: method === 'GET' ? undefined : body,
  });
  return handleRequest(request, () => assert.fail('A API tentou servir um arquivo'), db);
}

async function conferirErro(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('Content-Type'), /application\/json/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Set-Cookie'), null);
  const data = await response.json();
  assert.equal(typeof data.error, 'string');
  assert.ok(data.error.length > 0);
}

test('JSON malformado ou sem objeto retorna 400', async (t) => {
  for (const body of ['{', 'null', '[]', '42']) {
    await conferirErro(await enviar(t, { body }), 400);
  }
});

test('método incorreto retorna 405 e informa o método permitido', async (t) => {
  const response = await enviar(t, { method: 'GET' });
  await conferirErro(response, 405);
  assert.equal(response.headers.get('Allow'), 'POST');
});

test('origem diferente retorna 403', async (t) => {
  await conferirErro(await enviar(t, { headers: { Origin: 'https://outro.test' } }), 403);
});

test('tipo de conteúdo incompatível retorna 415', async (t) => {
  await conferirErro(await enviar(t, { headers: { 'Content-Type': 'text/plain' } }), 415);
});

test('tamanho declarado acima do limite retorna 413', async (t) => {
  await conferirErro(await enviar(t, { headers: { 'Content-Length': String(limite + 1) } }), 413);
});

test('aceita o limite exato e conta os bytes recebidos mesmo sem tamanho declarado', async (t) => {
  const comAcentos = JSON.stringify({ texto: 'é'.repeat(10) });
  const noLimite = comAcentos + ' '.repeat(limite - Buffer.byteLength(comAcentos));
  assert.equal((await enviar(t, { body: noLimite })).status, 200);
  await conferirErro(await enviar(t, { body: noLimite + ' ' }), 413);
});
