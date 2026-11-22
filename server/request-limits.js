import { digest } from './auth.js';

const WINDOW_MS = 10 * 60 * 1000;

// Retorna zero se a tentativa puder prosseguir, ou o tempo de espera em segundos.
export async function retryAfter(db, action, scope, value, max) {
  const now = Date.now();
  const key = digest(JSON.stringify([action, scope, value]));
  const row = await db.prepare(`
    INSERT INTO request_limits (key, expires, attempts) VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      attempts = CASE WHEN expires <= ? THEN 1 ELSE attempts + 1 END,
      expires = CASE WHEN expires <= ? THEN excluded.expires ELSE expires END
    RETURNING attempts, expires
  `).bind(key, now + WINDOW_MS, now, now).first();

  if (row.attempts === 1) {
    await db.prepare('DELETE FROM request_limits WHERE expires <= ?').bind(now).run();
  }
  return row.attempts > max ? Math.ceil((row.expires - now) / 1000) : 0;
}
