import test from 'node:test';
import assert from 'node:assert/strict';
import * as publication from '../../src/domain/publication.js';
import { isValidSlug } from '../../src/domain/validation.js';

const ana = { slug: 'ana-viola', profile: { name: 'Ana Sá', city: 'São Paulo', instrument: 'Viola' } };
const homonima = { slug: 'ana-violao', profile: { name: 'Ana Sá', city: 'Belém', instrument: 'Violão' } };
const artistas = [homonima, ana];

test('busca por nome conserva os dois homônimos e seus endereços', () => {
  assert.deepEqual(publication.searchArtists(artistas, '  ANA SA '), artistas);
});

test('busca parcial por cidade e instrumento ignora acentos', () => {
  assert.deepEqual(publication.searchArtists(artistas, 'bele'), [homonima]);
  assert.deepEqual(publication.searchArtists(artistas, 'VIOlao'), [homonima]);
});

test('combina a busca com instrumento exato e aceita filtros vazios', () => {
  assert.deepEqual(publication.searchArtists(artistas), artistas);
  assert.deepEqual(publication.searchArtists(artistas, 'ana', '  VIOLA '), [ana]);
  assert.deepEqual(publication.searchArtists(artistas, 'São Paulo', 'Violão'), []);
});

test('endereços das páginas da aplicação ficam reservados', () => {
  for (const slug of ['explorar', 'perfil', 'agenda', 'publicacao', 'contato']) {
    assert.equal(isValidSlug(slug), false, slug);
  }
  assert.equal(isValidSlug('ana-viola'), true);
});
