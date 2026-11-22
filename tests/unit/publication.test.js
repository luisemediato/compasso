import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublication, hasUnpublishedChanges } from '../../src/domain/publication.js';

function rascunho() {
  const evento = { id: 'e1', title: 'Recital', date: '2026-11-24', time: '19:00', venue: 'Teatro' };
  return {
    profile: { name: 'Ana Cordas', instrument: 'Viola' },
    works: [{ id: 'w1', title: 'Quarteto', url: 'https://example.test/obra' }],
    events: [{ ...evento, visibility: 'public' }, { ...evento, id: 'e2', visibility: 'private' },
      { ...evento, id: 'e3' }],
  };
}

test('publica nome artístico e somente contatos escolhidos pelo músico', () => {
  const draft = { ...rascunho(), fullName: 'Nome civil', email: 'login@example.test', revision: 2 };
  const data = '2026-11-21T19:00:00Z';
  assert.deepEqual(createPublication(draft, 'ana', data), {
    slug: 'ana', publishedAt: data, profile: draft.profile, works: draft.works, events: [draft.events[0]],
  });
  draft.profile.email = 'shows@example.test';
  assert.equal(createPublication(draft, 'ana').profile.email, 'shows@example.test');
});

test('exige instrumento e endereço válido para publicar', () => {
  const draft = rascunho();
  assert.throws(() => createPublication(draft, 'cadastro'), /endereço/i);
  draft.profile.instrument = '';
  assert.throws(() => createPublication(draft, 'ana'), /instrumento/i);
});

test('a publicação mantém cópias independentes do perfil, das obras e da agenda', () => {
  const draft = rascunho();
  const publicada = createPublication(draft, 'ana');
  draft.profile.name = 'Outro nome';
  draft.works[0].title = 'Outra obra';
  draft.events[0].venue = 'Outro palco';
  assert.equal(publicada.profile.name, 'Ana Cordas');
  assert.equal(publicada.works[0].title, 'Quarteto');
  assert.equal(publicada.events[0].venue, 'Teatro');
});

test('editar somente o ensaio privado não deixa publicação pendente', () => {
  const draft = rascunho();
  assert.equal(hasUnpublishedChanges(draft, null), true);
  const publicada = createPublication(draft, 'ana');
  draft.events[1].title = 'Ensaio de naipe';
  assert.equal(hasUnpublishedChanges(draft, publicada), false);
  draft.profile.city = 'Belo Horizonte';
  assert.equal(hasUnpublishedChanges(draft, publicada), true);
});

test('desmarcar o recital remove a apresentação na republicação', () => {
  const draft = rascunho();
  const primeira = createPublication(draft, 'ana');
  draft.events[0].visibility = 'private';
  assert.equal(hasUnpublishedChanges(draft, primeira), true);
  assert.equal(primeira.events.length, 1);
  const segunda = createPublication(draft, 'ana');
  assert.deepEqual(segunda.events, []);
  assert.equal(hasUnpublishedChanges(draft, segunda), false);
});
