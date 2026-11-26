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

  assert.equal(document.querySelector('main h1')?.textContent, 'Entre no seu espaço');
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

  assert.equal(document.querySelector('main h1')?.textContent, 'Crie sua conta de músico');
  assert.ok(artist);
  assert.ok(slug);
  assert.equal(artist.labels[0]?.textContent.trim(), 'Nome artístico');
  assert.equal(slug.labels[0]?.textContent.trim(), 'Endereço do portfólio');

  type(window, artist, 'João Silva');
  assert.equal(slug.value, 'joao-silva');
  const preview = document.getElementById('previa-endereco');
  assert.equal(preview?.textContent, 'http://localhost/joao-silva');

  type(window, slug, 'joao-viola');
  type(window, artist, 'João Silva Quarteto');
  assert.equal(slug.value, 'joao-viola');
  assert.equal(preview.textContent, 'http://localhost/joao-viola');
  type(window, slug, '');
  type(window, artist, 'Ána & Bia');
  assert.equal(slug.value, 'ana-bia');
});

test('cadastro associa a lista de regras à senha e o login aceita a senha anterior', t => {
  const register = openPage(t, '/cadastro').document;
  const password = register.querySelector('[name="password"]');
  assert.equal(password.minLength, 9);
  assert.equal(password.maxLength, 128);
  const help = register.getElementById(password.getAttribute('aria-describedby'));
  const rules = [...help.querySelectorAll('li')].map(item => item.textContent);
  assert.match(rules[0], /9 a 128/);
  assert.match(rules[1], /!.*@.*#/);
  const login = openPage(t, '/entrar').document.querySelector('[name="password"]');
  assert.equal(login.hasAttribute('minlength'), false);
});
