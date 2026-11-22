import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  verifyPassword,
  sessionCookie,
  readToken,
} from '../../server/auth.js';

test('verifica a senha correta e recusa outra senha', async () => {
  const hash = await hashPassword('ensaio-1!');

  assert.equal(await verifyPassword('ensaio-1!', hash), true);
  assert.equal(await verifyPassword('ensaio-2!', hash), false);
});

test('gera sais independentes para a mesma senha', async () => {
  const primeiro = await hashPassword('ensaio-1!');
  const segundo = await hashPassword('ensaio-1!');

  // O formato usado pelo Compasso é versão$sal$hash.
  assert.notEqual(primeiro.split('$')[1], segundo.split('$')[1]);
});

test('emite cookie de sessão protegido em HTTPS e lê o token na próxima requisição', () => {
  const token = 'ab'.repeat(32);
  const url = 'https://compasso.example/';
  const partes = sessionCookie(new Request(url), token).split('; ');

  assert.equal(partes[0], 'compasso_session=' + token);
  for (const atributo of ['Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=604800', 'Secure']) {
    assert.ok(partes.includes(atributo), atributo);
  }

  const request = new Request(url, {
    headers: { Cookie: 'tema=claro; ' + partes[0] },
  });
  assert.equal(readToken(request), token);
});