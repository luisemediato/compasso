import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { initials, escapeHtml } from '../../src/domain/formatting.js';
import { emptyState } from '../../src/ui/components.js';

test('usa as iniciais das duas primeiras palavras do nome', () => {
  assert.equal(initials('  luís   henrique emediato  '), 'LH');
});

test('retorna iniciais vazias quando o nome está em branco', () => {
  assert.equal(initials('   '), '');
});

test('escapa caracteres especiais ao preparar texto para HTML', () => {
  assert.equal(
    escapeHtml(`Ana & Bia <duo> "ao vivo" 'hoje'`),
    'Ana &amp; Bia &lt;duo&gt; &quot;ao vivo&quot; &#39;hoje&#39;'
  );
});

test('exibe a mensagem de lista vazia preservando o texto recebido', () => {
  const mensagem = 'Nenhum trabalho de <b>Ana & Bia</b>.';
  const fragmento = JSDOM.fragment(emptyState(mensagem));

  assert.equal(fragmento.textContent.trim(), mensagem);
  assert.equal(fragmento.querySelector('b'), null);
});
