import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestSlug, accountError, newDraft } from '../../src/domain/account.js';
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

const contaValida = {
  fullName: 'João da Silva',
  name: 'João Viola',
  email: 'joao@example.com',
  password: 'abcdefg!',
  slug: 'joao-viola',
};

test('aceita cadastro completo com senha de 8 caracteres e um símbolo', () => {
  assert.equal(accountError(contaValida), '');
});

test('recusa o cadastro quando falta um campo obrigatório', () => {
  for (const campo of Object.keys(contaValida)) {
    const conta = { ...contaValida };
    delete conta[campo];
    assert.ok(accountError(conta), `deveria exigir ${campo}`);
  }
});

test('recusa nomes em branco ou com mais de 120 caracteres', () => {
  for (const campo of ['name', 'fullName']) {
    for (const valor of ['   ', 'a'.repeat(121)]) {
      assert.match(accountError({ ...contaValida, [campo]: valor }), /nome/i);
    }
  }
});

test('recusa e-mail inválido e endereço de portfólio reservado', () => {
  assert.match(accountError({ ...contaValida, email: 'joao@' }), /e-mail/i);
  assert.match(accountError({ ...contaValida, slug: 'cadastro' }), /endereço/i);
});

test('recusa senhas com 7 ou 129 caracteres e aceita com 128', () => {
  for (const tamanho of [7, 129]) {
    const password = 'a'.repeat(tamanho - 1) + '!';
    assert.match(accountError({ ...contaValida, password }), /senha/i);
  }

  const password = 'a'.repeat(127) + '!';
  assert.equal(accountError({ ...contaValida, password }), '');
});

test('exige pelo menos um sinal de pontuação ou símbolo na senha', () => {
  for (const password of ['abcdefgh', 'abcdefg1', 'abcdefg ', 'abcdefgé']) {
    assert.match(accountError({ ...contaValida, password }), /senha/i);
  }
});

test('inicia rascunho com o nome artístico e contato público vazio', () => {
  assert.deepEqual(newDraft(contaValida.name), {
    profile: {
      name: 'João Viola',
      instrument: '',
      city: '',
      headline: '',
      bio: '',
      email: '',
      instagram: '',
    },
    events: [],
    works: [],
  });
});