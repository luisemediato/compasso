import { api } from './api.js';
import { routeFromPath } from '../src/domain/routes.js';

async function pageExists(path, db) {
  const route = routeFromPath(path);
  if (!route) return false;
  if (!route.startsWith('artist/')) return true;
  const row = await db.prepare('SELECT 1 FROM artists WHERE slug = ? AND publication IS NOT NULL')
    .bind(path.slice(1)).first();
  return Boolean(row);
}

export async function handleRequest(request, fetchAsset, db) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    return api(request, db);
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(null, {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  const isPage = !url.pathname.startsWith('/assets/') && !url.pathname.split('/').pop().includes('.');
  if (isPage) {
    const found = await pageExists(url.pathname, db);
    url.pathname = '/index.html';
    const index = await fetchAsset(new Request(url, { method: request.method }));
    const headers = new Headers(index.headers);
    headers.set('Cache-Control', 'no-store');
    return new Response(request.method === 'HEAD' ? null : index.body, {
      status: index.ok && !found ? 404 : index.status,
      headers,
    });
  }

  const asset = await fetchAsset(new Request(url, { method: request.method }));
  if (request.method === 'HEAD') {
    return new Response(null, { status: asset.status, headers: asset.headers });
  }

  return asset;
}
