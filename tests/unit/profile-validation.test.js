import test from 'node:test';
import assert from 'node:assert/strict';
import * as validation from '../../src/domain/validation.js';
import * as account from '../../src/domain/account.js';

const perfil = { ...account.newDraft('Ana Cordas').profile, instrument: 'Viola' };

test('perfil aceita contato vazio ou e-mail e link públicos válidos', () => {
  assert.equal(validation.validateProfile(perfil), '');
  assert.equal(validation.validateProfile({
    ...perfil, email: 'ana@example.test', instagram: 'https://www.instagram.com/ana/',
  }), '');
});

test('perfil completo exige nome e instrumento e verifica o contato informado', () => {
  for (const alteracao of [{ name: '  ' }, { instrument: '' }, { email: 'ana@' },
    { instagram: 'ftp://example.test/ana' }]) {
    assert.ok(validation.validateProfile({ ...perfil, ...alteracao }));
  }
});

test('bio aceita 3000 caracteres e recusa 3001', () => {
  assert.equal(validation.validateProfile({ ...perfil, bio: 'a'.repeat(3000) }), '');
  assert.ok(validation.validateProfile({ ...perfil, bio: 'a'.repeat(3001) }));
});

test('links aceitam HTTP e HTTPS absolutos e recusam outros protocolos', () => {
  for (const protocolo of ['http', 'https']) {
    const url = protocolo + '://example.test/ana';
    assert.equal(validation.safeUrl(url), url);
  }
  for (const url of ['', '/ana', 'mailto:ana@example.test', 'ftp://example.test/ana']) {
    assert.equal(validation.safeUrl(url), '');
  }
});

test('rascunho inicial permite completar o instrumento depois', () => {
  const draft = account.newDraft('Ana Cordas');
  assert.equal(account.draftError(draft), '');
  assert.ok(account.draftError({ ...draft, profile: { ...draft.profile, name: '  ' } }));
});

test('rascunho exige coleções e campos públicos de texto com tamanho válido', () => {
  const draft = account.newDraft('Ana Cordas');
  for (const alteracao of [null, { ...draft, works: {} }, { ...draft, events: null },
    { ...draft, profile: { ...perfil, password: 'privado' } },
    { ...draft, profile: { ...perfil, city: 42 } },
    { ...draft, profile: { ...perfil, city: 'a'.repeat(4001) } }]) {
    assert.ok(account.draftError(alteracao));
  }
});

test('coleções limitam quantidade, campos e IDs repetidos dentro de cada coleção', () => {
  const draft = account.newDraft('Ana Cordas');
  const works = Array.from({ length: 250 }, (_, i) => ({ id: String(i), title: 'Obra', url: 'https://example.test/obra' }));
  assert.equal(account.draftError({ ...draft, works }), '');
  for (const invalida of [[...works, { id: 'extra' }], [works[0], works[0]],
    [{ title: 'Sem ID' }], [{ id: 'x', privado: 'valor' }]]) {
    assert.ok(account.draftError({ ...draft, works: invalida }));
  }
  assert.ok(account.draftError({ ...draft, events: [{ id: 'evento com espaços' }] }));
});

test('normaliza usuário, arroba e URL para o mesmo perfil do Instagram', () => {
  const canonical = 'https://www.instagram.com/ana.viola/';
  for (const input of ['ana.viola', ' @Ana.Viola ', canonical,
    'https://instagram.com/ana.viola?igsh=teste']) {
    assert.equal(validation.normalizeInstagram(input), canonical);
    assert.equal(validation.validateProfile({ ...perfil, instagram: input }), '');
  }
});

test('Instagram vazio continua opcional e não gera link', () => {
  assert.equal(validation.normalizeInstagram('   '), '');
  assert.equal(validation.validateProfile({ ...perfil, instagram: '' }), '');
});

test('recusa outro domínio, publicações e entradas que não identificam um perfil', () => {
  for (const input of ['https://example.test/ana', 'https://instagram.com.exemplo.test/ana',
    'https://instagram.com/p/foto/', 'https://instagram.com/', 'https://instagram.com/reels/',
    'ana viola', '@', 'ana..viola']) {
    assert.ok(validation.validateProfile({ ...perfil, instagram: input }), input);
    assert.equal(validation.normalizeInstagram(input), '');
  }
});
