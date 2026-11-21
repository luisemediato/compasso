import { randomUUID } from 'node:crypto';
import { accountError, newDraft } from '../src/domain/account.js';
import { hashPassword, newSession, sessionCookie } from './auth.js';

function json(data, status, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

async function register(request, db, body) {
  const email = typeof body.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';

  const reason = accountError({ ...body, email });
  if (reason) return json({ error: reason }, 400);

  const id = randomUUID();
  const hash = await hashPassword(body.password);
  const draft = newDraft(body.name.trim());

  const insertArtist = db.prepare(`
    INSERT INTO artists (id, email, full_name, slug, password_hash, draft)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    email,
    body.fullName.trim(),
    body.slug,
    hash,
    JSON.stringify(draft),
  );

  const session = newSession(db, id);

  try {
    await db.batch([insertArtist, session.insert]);
  } catch (cause) {
    const message = `${cause} ${cause?.cause ?? ''}`;

    if (/UNIQUE constraint failed: artists\.(email|slug)\b/i.test(message)) {
      return json({ error: 'Este e-mail ou endereço de portfólio já está em uso.' }, 409);
    }

    throw cause;
  }

  return json({ ok: true }, 201, {
    'Set-Cookie': sessionCookie(request, session.token),
  });
}

export async function api(request, db) {
  const url = new URL(request.url);

  if (url.pathname !== '/api/register') {
    return json({ error: 'Recurso não encontrado.' }, 404);
  }

  if (request.method !== 'POST') {
    return json({ error: 'Método indisponível.' }, 405, { Allow: 'POST' });
  }

  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) {
    return json({ error: 'Origem inválida.' }, 403);
  }

  const contentType = request.headers.get('Content-Type') ?? '';
  if (contentType.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return json({ error: 'Envie JSON.' }, 415);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Dados inválidos.' }, 400);
  }

  return register(request, db, body);
}