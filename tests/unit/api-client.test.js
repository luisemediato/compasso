import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../../src/data/api.js';

test('cliente envia JSON e cookies da mesma origem', async () => {
  const api = createApi(async (url, options) => {
    assert.equal(url, '/api/register');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { name: 'Davi' });
    return Response.json({ ok: true }, { status: 201 });
  });
  assert.deepEqual(await api('/api/register', { name: 'Davi' }), { ok: true });
});

test('cliente consulta sessão sem corpo e aceita sessão anônima', async () => {
  const api = createApi(async (_url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.body, undefined);
    return Response.json(null);
  });
  assert.equal(await api('/api/session'), null);
});

test('erro HTTP mantém status e mensagem do servidor', async () => {
  const api = createApi(async () => Response.json({ error: 'Endereço ocupado.' }, { status: 409 }));
  await assert.rejects(api('/api/register', {}), { message: 'Endereço ocupado.', status: 409 });
});

test('erro de rede tem mensagem acionável sem simular sucesso', async () => {
  const api = createApi(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(api('/api/session'), /conexão/);
});

test('resposta inválida e erro HTTP sem JSON têm mensagens seguras', async () => {
  await assert.rejects(createApi(async () => new Response('<html>'))('/api/session'), /Resposta inválida/);
  await assert.rejects(createApi(async () => new Response('', { status: 503 }))('/api/session'), { status: 503 });
  await assert.rejects(createApi(async () => Response.json({}, { status: 500 }))('/api/session'), /500/);
});
