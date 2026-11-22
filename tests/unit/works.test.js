import test from 'node:test';
import assert from 'node:assert/strict';
import * as validation from '../../src/domain/validation.js';
import { draftError, newDraft } from '../../src/domain/account.js';

const obra = { id: 'w1', title: 'Recital de viola', url: 'https://example.test/recital' };
const outra = { ...obra, id: 'w2', title: 'Quarteto' };

test('aceita trabalho com título e link HTTP ou HTTPS', () => {
  for (const url of ['http://example.test/obra', obra.url]) {
    assert.equal(validation.validateWork({ ...obra, url }), '');
  }
});

test('recusa título em branco, link ausente, relativo ou de protocolo incompatível', () => {
  for (const campos of [{ title: '  ' }, { url: '' }, { url: '/video' }, { url: 'ftp://example.test' }]) {
    assert.ok(validation.validateWork({ ...obra, ...campos }));
  }
});

test('insere ao final sem modificar a coleção original', async () => {
  const { saveRecord } = await import('../../src/domain/collections.js');
  const original = Object.freeze([obra]);
  assert.deepEqual(saveRecord(original, outra), [obra, outra]);
  assert.deepEqual(original, [obra]);
});

test('edita pelo ID, mantendo posição e demais trabalhos', async () => {
  const { saveRecord } = await import('../../src/domain/collections.js');
  const editada = { ...obra, title: 'Recital de encerramento' };
  const original = [obra, outra];
  assert.deepEqual(saveRecord(original, editada), [editada, outra]);
  assert.deepEqual(original, [obra, outra]);
});

test('exclui somente o ID escolhido e tolera ID ausente', async () => {
  const { deleteRecord } = await import('../../src/domain/collections.js');
  const original = [obra, outra];
  assert.deepEqual(deleteRecord(original, obra.id), [outra]);
  assert.deepEqual(deleteRecord(original, 'ausente'), original);
  assert.deepEqual(original, [obra, outra]);
});

test('salvamento do rascunho também verifica o conteúdo do trabalho', () => {
  const draft = newDraft('Ana');
  assert.equal(draftError({ ...draft, works: [obra] }), '');
  assert.ok(draftError({ ...draft, works: [{ ...obra, url: '' }] }));
});
