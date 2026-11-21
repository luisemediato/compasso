import { createServer } from 'node:http';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { handleRequest } from '../server/http.js';

const files = new Map();
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
};

async function loadFiles(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = join(directory, entry.name);
    const pathname = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      await loadFiles(filename, pathname);
    } else if (entry.isFile()) {
      files.set(pathname, await readFile(filename));
    }
  }
}

await loadFiles('dist/public');

function fetchAsset(request) {
  const pathname = new URL(request.url).pathname;
  const contents = files.get(pathname);
  if (!contents) return new Response(null, { status: 404 });

  return new Response(contents, {
    headers: { 'Content-Type': types[extname(pathname)] ?? 'application/octet-stream' },
  });
}

const port = Number(process.env.PORT ?? 4173);

createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, `http://localhost:${port}`);
    const request = new Request(url, { method: incoming.method });
    const response = await handleRequest(request, fetchAsset);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500);
    outgoing.end();
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Compasso disponível em http://localhost:${port}`);
});
