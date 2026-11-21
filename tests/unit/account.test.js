import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestSlug } from '../../src/domain/account.js';
import { isValidSlug } from '../../src/domain/validation.js';

test('sugere joao-silva como endereço para João Silva', () => {
  assert.equal(suggestSlug('João Silva'), 'joao-silva');
});

test('ignora espaços nas pontas e agrupa espaços entre os nomes', () => {
  assert.equal(suggestSlug('  João   Silva  '), 'joao-silva');
});

test('aceita um endereço com hífen entre palavras', () => {
  assert.equal(isValidSlug('joao-silva'), true);
});

test('recusa endereço vazio ou com hífens mal posicionados', () => {
  for (const slug of ['', '-joao', 'joao-', 'joao--silva']) {
    assert.equal(isValidSlug(slug), false, `deveria recusar "${slug}"`);
  }
});

test('reserva o endereço entrar para a aplicação', () => {
  assert.equal(isValidSlug('entrar'), false);
});

test('reserva o endereço cadastro para a aplicação', () => {
  assert.equal(isValidSlug('cadastro'), false);
});