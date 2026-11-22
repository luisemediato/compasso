import { draftError } from '../domain/draft.js';
import { seed } from './seed.js';

function fallback(recovered) {
  return { state: { ...structuredClone(seed), publication: null }, source: null, recovered };
}

export function createRepository(storage) {
  function load() {
    try {
      const local = storage ?? globalThis.localStorage;
      for (const key of ['compasso-v2', 'compasso-v1']) {
        const raw = local.getItem(key);
        if (raw === null) continue;
        const { profile, works, events } = JSON.parse(raw);
        const draft = { profile, works, events };
        if (draftError(draft)) return fallback(true);
        return { state: { ...draft, publication: null }, source: key, recovered: false };
      }
      return fallback(false);
    } catch {
      return fallback(true);
    }
  }

  async function importDraft(account, { confirm, save }) {
    if (!account?.id || !Number.isSafeInteger(account.revision) || account.revision < 0) return null;
    const { id, revision, slug } = account;
    const { state, source } = load();
    if (!source) return null;
    const aviso = `Substituir o rascunho de /${slug} pelos dados deste navegador? A versão publicada será preservada.`;
    if (await confirm(aviso) !== true) return null;
    const { profile, works, events } = state;
    return save({ id, revision, profile, works, events });
  }

  return { load, importDraft };
}
