import test from 'node:test';
import assert from 'node:assert/strict';
import { createRepository } from '../../src/data/repository.js';
import { newDraft } from '../../src/domain/account.js';

const conta = { id: 'conta-atual', slug: 'ana', revision: 3 };

function storage(entries = {}) {
  return { getItem: key => entries[key] ?? null };
}

test('sem dados locais, os exemplos são independentes e nunca são oferecidos para importar', async () => {
  const repo = createRepository(storage());
  const primeiro = repo.load();
  assert.equal(primeiro.source, null);
  assert.equal(primeiro.recovered, false);
  primeiro.state.profile.name = 'Alterado';
  assert.notEqual(repo.load().state.profile.name, 'Alterado');
  assert.equal(await repo.importDraft(conta, { confirm: assert.fail, save: assert.fail }), null);
});

test('storage bloqueado, JSON quebrado ou estrutura inválida preservam a conta e o original', async () => {
  for (const raw of ['{', 'null', JSON.stringify({ ...newDraft('Ana'), works: [{}] })]) {
    const local = storage({ 'compasso-v2': raw });
    const repo = createRepository(local);
    assert.equal(repo.load().recovered, true);
    assert.equal(await repo.importDraft(conta, { confirm: assert.fail, save: assert.fail }), null);
    assert.equal(local.getItem('compasso-v2'), raw);
  }
  const bloqueado = createRepository({ getItem() { throw new Error('storage indisponível'); } });
  assert.equal(bloqueado.load().recovered, true);
  assert.equal(await bloqueado.importDraft(conta, { confirm: assert.fail, save: assert.fail }), null);
});

test('lê v1 e dá preferência ao v2 quando ambos existem', () => {
  const dados = { 'compasso-v1': JSON.stringify(newDraft('Primeira versão')) };
  const repo = createRepository(storage(dados));
  assert.equal(repo.load().state.profile.name, 'Primeira versão');
  dados['compasso-v2'] = JSON.stringify(newDraft('Segunda versão'));
  assert.equal(repo.load().source, 'compasso-v2');
  assert.equal(repo.load().state.profile.name, 'Segunda versão');
});

test('só envia os campos do rascunho após confirmação explícita para a conta atual', async () => {
  const draft = newDraft('Ana de antes');
  const local = { ...draft, id: 'antiga', slug: 'antiga', revision: 87, publication: { slug: 'antiga' } };
  const repo = createRepository(storage({ 'compasso-v1': JSON.stringify(local) }));
  assert.equal(await repo.importDraft(null, { confirm: assert.fail, save: assert.fail }), null);
  assert.equal(await repo.importDraft(conta, { confirm: async () => false, save: assert.fail }), null);
  const ordem = [];
  const result = await repo.importDraft(conta, {
    confirm: aviso => {
      ordem.push('confirmar');
      assert.match(aviso, /Substituir o rascunho de \/ana/);
      return true;
    },
    save: payload => {
      ordem.push('salvar');
      assert.deepEqual(payload, { id: conta.id, revision: conta.revision, ...draft });
      return 'salvo';
    },
  });
  assert.deepEqual(ordem, ['confirmar', 'salvar']);
  assert.equal(result, 'salvo');
});
