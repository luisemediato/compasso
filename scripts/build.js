import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/public/assets', { recursive: true });
await cp('public', 'dist/public', { recursive: true });
await cp('src/styles/main.css', 'dist/public/assets/main.css');

await build({
  entryPoints: ['src/main.js'],
  outfile: 'dist/public/assets/main.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
});

await build({
  entryPoints: ['server/worker.js'],
  outfile: 'dist/server/index.js',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  external: ['node:*'],
});