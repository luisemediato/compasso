import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderShell } from '../../src/ui/shell.js';

test('a estrutura da página contém cabeçalho, área principal e rodapé', () => {
  const { document } = new JSDOM(renderShell()).window;

  assert.ok(document.querySelector('header'), 'deve existir um cabeçalho');
  assert.ok(document.querySelector('main'), 'deve existir uma área principal');
  assert.ok(document.querySelector('footer'), 'deve existir um rodapé');
});

test('o cabeçalho apresenta o título Compasso e um link para o início', () => {
  const { document } = new JSDOM(renderShell()).window;

  const titulo = document.querySelector('header h1');
  assert.equal(titulo?.textContent.trim(), 'Compasso');

  const inicio = document.querySelector('header nav a[href="/"]');
  assert.equal(inicio?.textContent.trim(), 'Início');
});
