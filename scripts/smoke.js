import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Somente leitura: pode ser executado contra produção sem cadastrar dados de teste.
export async function verifyDeployment(baseURL, { fetcher = fetch, directPath = '/explorar' } = {}) {
  const base = new URL(baseURL);
  assert.ok(['https:', 'http:'].includes(base.protocol), 'Informe uma URL HTTP ou HTTPS.');
  assert.ok(directPath.startsWith('/') && !directPath.startsWith('//'), 'Use um caminho do mesmo site.');
  const checks = [
    ['/', 'text/html', /id="app"/],
    ['/assets/main.css', 'text/css', /box-sizing/],
    ['/assets/main.js', 'javascript', /Compasso/],
    ['/api/artists', 'application/json', null],
    [directPath, 'text/html', /id="app"/],
  ];
  const results = [];
  for (const [path, type, pattern] of checks) {
    const response = await fetcher(new URL(path, base.origin), { redirect: 'error', signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, `${path}: status esperado 200`);
    assert.ok(response.headers.get('content-type')?.includes(type), `${path}: Content-Type deve conter ${type}`);
    if (pattern) assert.match(await response.text(), pattern, `${path}: conteúdo inesperado`);
    else assert.ok(Array.isArray(await response.json()), 'A API pública deve responder uma lista.');
    results.push({ path, status: response.status });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseURL = process.argv[2] || process.env.COMPASSO_URL;
  if (!baseURL) {
    console.error('Uso: npm run test:smoke -- https://URL-PUBLICA [/${slug}]');
    process.exitCode = 1;
  } else {
    try {
      for (const result of await verifyDeployment(baseURL, { directPath: process.argv[3] || '/explorar' })) {
        console.log(`${result.status} ${result.path}`);
      }
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
