import { pathToFileURL } from 'node:url';

// Só cria um endereço quando a API confirma que a conta ainda não tem um.
export async function ensureWorkersSubdomain({ accountId, token, subdomain, fetcher = fetch }) {
  if (!accountId || !token || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain || '')) {
    throw new Error('Informe conta, token e subdomínio workers.dev válido.');
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/subdomain`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const current = await fetcher(url, { headers, signal: AbortSignal.timeout(30000) });
  const state = await current.json();
  if (current.ok && state.success && state.result?.subdomain) return state.result.subdomain;
  if (!state.errors?.some(error => error.code === 10007)) {
    throw new Error(`Não foi possível consultar workers.dev (HTTP ${current.status}). Confira a permissão Workers Scripts Write do token.`);
  }
  const response = await fetcher(url, {
    method: 'PUT', headers, body: JSON.stringify({ subdomain }), signal: AbortSignal.timeout(30000),
  });
  const created = await response.json();
  if (!response.ok || !created.success || !created.result?.subdomain) {
    throw new Error(`Não foi possível cadastrar workers.dev (HTTP ${response.status}). Confira a disponibilidade do nome e a permissão Workers Scripts Write.`);
  }
  return created.result.subdomain;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const subdomain = await ensureWorkersSubdomain({
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    token: process.env.CLOUDFLARE_API_TOKEN,
    subdomain: process.env.COMPASSO_WORKERS_SUBDOMAIN,
  });
  console.log(`Endereço da conta disponível: ${subdomain}.workers.dev`);
}
