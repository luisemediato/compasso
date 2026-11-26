import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderHome } from '../../src/pages/home.js';

test('a home oferece descoberta para visitantes e acesso para músicos', () => {
  const { document } = new JSDOM(renderHome()).window;
  const hero = document.querySelector('section[aria-labelledby="titulo-inicio"]');
  assert.match(hero?.querySelector('h1')?.textContent ?? '', /Seu talento merece/);
  assert.equal(hero.querySelector('a[href="/explorar"]').textContent.trim(), 'Descobrir músicos');
  assert.equal(hero.querySelector('a[href="/cadastro"]').textContent.trim(), 'Organizar meu espaço');
  assert.ok(hero.querySelector('img[alt]').alt.trim());
  assert.equal(document.querySelector('#titulo-vitrine')?.textContent, 'Conheça novos sons');
});
