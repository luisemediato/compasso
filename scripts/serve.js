import { createServer } from 'node:http';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { handleRequest } from '../server/http.js';
import { openDatabase } from '../server/local-db.js';

const files = new Map();
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
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

await mkdir('.local', { recursive: true });
const db = openDatabase(process.env.COMPASSO_DB ?? '.local/compasso.sqlite');

const server = createServer(async (incoming, outgoing) => {
  try {
    const host = incoming.headers.host ?? `localhost:${port}`;
    const url = new URL(incoming.url, `http://${host}`);
    const options = {
      method: incoming.method,
      headers: incoming.headers,
    };

    if (incoming.method !== 'GET' && incoming.method !== 'HEAD') {
      options.body = incoming;
      options.duplex = 'half';
    }

    const request = new Request(url, options);
    const response = await handleRequest(request, fetchAsset, db, incoming.socket.remoteAddress);

    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500);
    outgoing.end();
  }
});

server.on('close', () => db.close());

server.listen(port, '127.0.0.1', () => {
  console.log(`Compasso disponível em http://localhost:${port}`);
});
