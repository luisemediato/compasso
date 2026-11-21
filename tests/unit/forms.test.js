import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { startApp } from '../../src/app.js';

function openPage(t, path) {
  const dom = new JSDOM('<div id="app"></div>', {
    url: `http://localhost${path}`,
  });
  t.after(() => dom.window.close());
  startApp(dom.window);
  return dom.window;
}

function type(window, input, value) {
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

test('entrada apresenta e-mail e senha com rótulos e senha oculta', (t) => {
  const { document } = openPage(t, '/entrar');
  const email = document.querySelector('input[name="email"]');
  const password = document.querySelector('input[name="password"]');

  assert.ok(email);
  assert.ok(password);
  assert.equal(email.labels[0]?.textContent.trim(), 'E-mail');
  assert.equal(password.labels[0]?.textContent.trim(), 'Senha');
  assert.equal(password.type, 'password');
});

test('cadastro sugere o endereço e preserva a edição manual', (t) => {
  const window = openPage(t, '/cadastro');
  const { document } = window;
  const artist = document.querySelector('input[name="artistName"]');
  const slug = document.querySelector('input[name="slug"]');

  assert.ok(artist);
  assert.ok(slug);
  assert.equal(artist.labels[0]?.textContent.trim(), 'Nome artístico');
  assert.equal(slug.labels[0]?.textContent.trim(), 'Endereço do portfólio');

  type(window, artist, 'João Silva');
  assert.equal(slug.value, 'joao-silva');

  type(window, slug, 'joao-viola');
  type(window, artist, 'João Silva Quarteto');
  assert.equal(slug.value, 'joao-viola');
});
