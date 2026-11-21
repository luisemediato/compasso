import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { startApp } from '../../src/app.js';

test('abrir Explorar e voltar pelo histórico restaura a home', async (t) => {
  const dom = new JSDOM('<div id="app"></div>', {
    url: 'http://localhost/',
  });
  const { window } = dom;
  const { document } = window;
  t.after(() => window.close());

  startApp(window);

  const explorar = document.querySelector('main a[href="/explorar"]');
  assert.ok(explorar, 'a home deve oferecer o link Explorar');

  explorar.click();

  assert.equal(window.location.pathname, '/explorar');
  assert.match(document.querySelector('main').textContent, /Explorar estará disponível em breve/);

  const voltou = new Promise(resolve => {
    window.addEventListener('popstate', resolve, { once: true });
  });
  window.history.back();
  await voltou;

  assert.equal(window.location.pathname, '/');
  assert.ok(document.querySelector('main a[href="/explorar"]'));

  const avancou = new Promise(resolve => {
    window.addEventListener('popstate', resolve, { once: true });
  });

  window.history.forward();
  await avancou;

  assert.equal(window.location.pathname, '/explorar');
  assert.match(
    document.querySelector('main').textContent,
    /Explorar estará disponível em breve/
  );
});
