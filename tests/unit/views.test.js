import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderHome } from '../../src/pages/home.js';

test('a home oferece descoberta para visitantes e acesso para músicos', () => {
  const { document } = new JSDOM(renderHome()).window;
  const links = [...document.querySelectorAll('a[href]')];

  const acoes = [
    ['Explorar', '/explorar'],
    ['Entrar', '/entrar'],
    ['Cadastrar', '/cadastrar'],
  ];

  for (const [nome, destino] of acoes) {
    const link = links.find((item) => item.textContent.trim() === nome);
    assert.ok(link, `a home deve exibir o link "${nome}"`);
    assert.equal(link.getAttribute('href'), destino);
  }
});
