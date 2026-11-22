import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('o Worker usa o build, os arquivos públicos e as migrações do Compasso', async () => {
  const arquivo = new URL('../../wrangler.json', import.meta.url);
  const config = JSON.parse(await readFile(arquivo, 'utf8'));

  assert.equal(config.main, 'dist/server/index.js');
  assert.ok(config.compatibility_flags.includes('nodejs_compat'));
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.assets.directory, 'dist/public');

  const banco = config.d1_databases.find(item => item.binding === 'DB');
  assert.equal(banco?.migrations_dir, 'drizzle');
});
