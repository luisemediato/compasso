import { validateEvent, validateProfile, validateWork } from './validation.js';

const COLLECTION_FIELDS = {
  works: new Set(['id', 'title', 'url', 'type', 'description']),
  events: new Set(['id', 'title', 'date', 'time', 'venue', 'city', 'type', 'ticket', 'description', 'visibility']),
};

export function draftError(draft) {
  const error = validateProfile(draft?.profile, { requireInstrument: false });
  if (error) return error;

  for (const [collection, fields] of Object.entries(COLLECTION_FIELDS)) {
    const rows = draft[collection];
    if (!Array.isArray(rows) || rows.length > 250) return 'Use até 250 registros por coleção.';
    const validateRecord = collection === 'works' ? validateWork : validateEvent;
    const ids = new Set();
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(row.id)
          || ids.has(row.id)) return 'Registro sem ID válido ou repetido.';
      for (const [key, value] of Object.entries(row)) {
        if (!fields.has(key) || typeof value !== 'string' || value.length > 4000) {
          return 'Campo de registro inválido.';
        }
      }
      const recordError = validateRecord(row);
      if (recordError) return recordError;
      ids.add(row.id);
    }
  }
  return '';
}
