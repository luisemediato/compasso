export async function handleRequest(request, fetchAsset) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const url = new URL(request.url);
  const isPage = !url.pathname.startsWith('/assets/') &&
    !url.pathname.startsWith('/api/') &&
    !url.pathname.split('/').pop().includes('.');

  if (isPage) url.pathname = '/index.html';

  const asset = await fetchAsset(new Request(url, { method: request.method }));
  if (request.method === 'HEAD') {
    return new Response(null, { status: asset.status, headers: asset.headers });
  }

  return asset;
}
