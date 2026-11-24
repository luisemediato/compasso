import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureWorkersSubdomain } from '../../scripts/workers-subdomain.js';

const options = { accountId: 'conta-teste', token: 'token-teste', subdomain: 'compasso-ufmg-2026' };

test('deploy preserva o subdomínio existente sem enviar alterações', async () => {
  let calls = 0;
  const result = await ensureWorkersSubdomain({ ...options, fetcher: async (_, request) => {
    calls++;
    assert.equal(request.method, undefined);
    return Response.json({ success: true, result: { subdomain: 'existente' } });
  } });
  assert.equal(result, 'existente');
  assert.equal(calls, 1);
});

test('deploy cadastra workers.dev somente após erro explícito de subdomínio ausente', async () => {
  const methods = [];
  const result = await ensureWorkersSubdomain({ ...options, fetcher: async (url, request) => {
    assert.equal(url, 'https://api.cloudflare.com/client/v4/accounts/conta-teste/workers/subdomain');
    methods.push(request.method || 'GET');
    if (!request.method) return Response.json({ success: false, errors: [{ code: 10007 }] }, { status: 404 });
    assert.equal(request.headers.Authorization, 'Bearer token-teste');
    assert.deepEqual(JSON.parse(request.body), { subdomain: options.subdomain });
    return Response.json({ success: true, result: { subdomain: options.subdomain } });
  } });
  assert.deepEqual(methods, ['GET', 'PUT']);
  assert.equal(result, options.subdomain);
});

test('deploy interrompe erros de consulta e cadastro sem expor credenciais', async () => {
  for (const failOnCreate of [false, true]) {
    let calls = 0;
    await assert.rejects(ensureWorkersSubdomain({ ...options, fetcher: async () => {
      calls++;
      if (failOnCreate && calls === 1) return Response.json({ errors: [{ code: 10007 }] }, { status: 404 });
      return Response.json({ success: false, errors: [{ code: 10000 }] }, { status: 403 });
    } }), /Workers Scripts Write/);
    assert.equal(calls, failOnCreate ? 2 : 1);
  }
});
