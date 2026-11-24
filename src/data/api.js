// A fronteira HTTP é injetável para testar o navegador sem rede.
export function createApi(fetcher = globalThis.fetch) {
  return async function request(path, body) {
    let response;
    try {
      response = await fetcher(path, {
        method: body === undefined ? 'GET' : 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new Error('Não foi possível conectar. Verifique sua conexão e tente novamente.');
    }
    let data;
    try { data = await response.json(); } catch {
      throw Object.assign(new Error(response.ok ? 'Resposta inválida do servidor.' : `Falha no servidor (${response.status}).`), { status: response.status });
    }
    if (!response.ok) {
      throw Object.assign(new Error(typeof data?.error === 'string' ? data.error : `Falha no servidor (${response.status}).`), { status: response.status });
    }
    return data;
  };
}
