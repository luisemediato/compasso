import { randomUUID } from 'node:crypto';
import { accountError, newDraft } from '../src/domain/account.js';
import {
  activeArtist, digest, hashPassword, newSession, readToken, sessionCookie, verifyPassword,
} from './auth.js';

const INVALID_CREDENTIALS = 'E-mail ou senha incorretos.';
// Mesmo um e-mail desconhecido passa por uma verificação de senha.
const DUMMY_HASH = ['s1', '0'.repeat(32), '0'.repeat(64)].join('$');

function json(data, status, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

async function startSession(request, db, artistId, status, statements = []) {
  const session = newSession(db, artistId);
  const removeOld = db.prepare('DELETE FROM sessions WHERE expires <= ? OR digest = ?')
    .bind(Date.now(), digest(readToken(request)));

  await db.batch([...statements, removeOld, session.insert]);
  return json({ ok: true }, status, {
    'Set-Cookie': sessionCookie(request, session.token),
  });
}

async function register(request, db, body) {
  const email = normalizeEmail(body.email);

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

  try {
    return await startSession(request, db, id, 201, [insertArtist]);
  } catch (cause) {
    const message = `${cause} ${cause?.cause ?? ''}`;

    if (/UNIQUE constraint failed: artists\.(email|slug)\b/i.test(message)) {
      return json({ error: 'Este e-mail ou endereço de portfólio já está em uso.' }, 409);
    }

    throw cause;
  }
}

async function login(request, db, body) {
  const email = normalizeEmail(body.email);
  const password = body.password;
  if (!email || email.length > 254 || typeof password !== 'string'
      || password.length === 0 || password.length > 128) {
    return json({ error: INVALID_CREDENTIALS }, 401);
  }

  const artist = await db.prepare('SELECT id, password_hash FROM artists WHERE email = ?')
    .bind(email).first();
  const valid = await verifyPassword(password, artist?.password_hash ?? DUMMY_HASH);
  if (!artist || !valid) return json({ error: INVALID_CREDENTIALS }, 401);

  return startSession(request, db, artist.id, 200);
}

async function getSession(request, db) {
  const artist = await activeArtist(db, request);
  if (!artist) return json(null, 200);

  const { profile, works, events } = JSON.parse(artist.draft);
  return json({
    id: artist.id,
    slug: artist.slug,
    revision: artist.revision,
    profile,
    works,
    events,
    publication: JSON.parse(artist.publication ?? 'null'),
  }, 200);
}

async function logout(request, db) {
  const token = readToken(request);
  if (token) {
    await db.prepare('DELETE FROM sessions WHERE digest = ?').bind(digest(token)).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(request, '') });
}

const postRoutes = new Map([
  ['/api/register', register],
  ['/api/login', login],
  ['/api/logout', logout],
]);

const MAX_BODY_BYTES = 400_000;

async function readJson(request) {
  const tooLarge = () => json({ error: 'Conteúdo muito grande.' }, 413);
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) {
    return { error: tooLarge() };
  }

  const reader = request.body?.getReader();
  if (!reader) return { error: json({ error: 'JSON inválido.' }, 400) };

  let bytes = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return { error: tooLarge() };
      }
      text += decoder.decode(value, { stream: true });
    }
    return { value: JSON.parse(text + decoder.decode()) };
  } catch {
    return { error: json({ error: 'JSON inválido.' }, 400) };
  } finally {
    reader.releaseLock();
  }
}

export async function api(request, db) {
  const url = new URL(request.url);

  if (url.pathname === '/api/session') {
    if (request.method !== 'GET') {
      return json({ error: 'Método indisponível.' }, 405, { Allow: 'GET' });
    }
    return getSession(request, db);
  }

  const handler = postRoutes.get(url.pathname);
  if (!handler) {
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

  const parsed = await readJson(request);
  if (parsed.error) return parsed.error;
  const body = parsed.value;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Dados inválidos.' }, 400);
  }

  return handler(request, db, body);
}