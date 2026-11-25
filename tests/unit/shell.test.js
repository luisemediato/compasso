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

test('a marca leva ao início e o visitante pode explorar, entrar e cadastrar', () => {
  const { document } = new JSDOM(renderShell()).window;
  const header = document.querySelector('header');
  assert.ok(header.querySelector('a[href="/"][aria-label="Compasso início"]'));
  for (const [path, label] of [
    ['/', 'Início'], ['/explorar', 'Explorar músicos'], ['/entrar', 'Entrar'], ['/cadastro', 'Criar conta'],
  ]) {
    const links = [...header.querySelectorAll(`a[href="${path}"]`)];
    assert.ok(links.some(link => link.textContent.trim() === label), label);
  }
});
