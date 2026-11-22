import { Buffer } from "node:buffer";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 48 * 1024 * 1024 };
const lifetime = 60 * 60 * 24 * 7;
const cookieName = "compasso_session";

export function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 32, options);
  return ["s1", salt, key.toString("hex")].join("$");
}

export async function verifyPassword(password, stored) {
  const [, salt, expected] = stored.split("$");
  const actual = await derive(password, salt, 32, options);
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

export function readToken(request) {
  const cookie = request.headers.get("cookie") || "";
  return (
    cookie.match(/(?:^|;\s*)compasso_session=([0-9a-f]{64})(?:;|$)/)?.[1] || ""
  );
}

export function sessionCookie(request, token) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return (
    cookieName +
    "=" +
    token +
    "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" +
    (token ? lifetime : 0) +
    secure
  );
}

export function newSession(db, userId) {
  const token = randomBytes(32).toString("hex");
  const insert = db
    .prepare("INSERT INTO sessions(digest,artist_id,expires) VALUES(?,?,?)")
    .bind(digest(token), userId, Date.now() + lifetime * 1000);
  return { token, insert };
}

export async function activeArtist(db, request) {
  const token = readToken(request);
  if (!token) return null;
  return db
    .prepare(
      "SELECT a.id,a.slug,a.draft,a.publication,a.revision FROM artists a JOIN sessions s ON a.id=s.artist_id WHERE s.digest=? AND s.expires>?",
    )
    .bind(digest(token), Date.now())
    .first();
}
