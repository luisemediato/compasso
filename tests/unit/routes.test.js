import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from '../../src/domain/routes.js';

test('o caminho / resolve para a página inicial', () => {
  assert.equal(resolveRoute('/'), 'home');
});
