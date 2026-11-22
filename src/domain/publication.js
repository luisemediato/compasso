import { draftError } from './draft.js';
import { isPublicEvent, isValidSlug, validateProfile } from './validation.js';

function publicContent(draft) {
  return { profile: draft.profile, works: draft.works, events: draft.events.filter(isPublicEvent) };
}

export function createPublication(draft, slug, now = new Date().toISOString()) {
  const error = validateProfile(draft?.profile) || draftError(draft);
  if (error) throw new Error(error);
  if (!isValidSlug(slug) || slug.length > 60) throw new Error('Escolha um endereço válido.');
  return structuredClone({ slug, ...publicContent(draft), publishedAt: now });
}

function sameRecord(first, second) {
  const keys = Object.keys(first);
  return keys.length === Object.keys(second).length && keys.every(key => first[key] === second[key]);
}

function sameList(first, second) {
  return first.length === second.length && first.every((item, index) => sameRecord(item, second[index]));
}

export function hasUnpublishedChanges(draft, publication) {
  if (!publication) return true;
  const { profile, works, events } = publicContent(draft);
  return !sameRecord(profile, publication.profile)
    || !sameList(works, publication.works)
    || !sameList(events, publication.events);
}

function searchText(value) {
  return (value ?? '').trim().normalize('NFD').replace(/\p{M}+/gu, '').toLowerCase();
}

export function searchArtists(publications, query = '', instrument = '') {
  const term = searchText(query);
  const selected = searchText(instrument);
  return publications.filter(({ profile }) => {
    if (selected && searchText(profile.instrument) !== selected) return false;
    return [profile.name, profile.city, profile.instrument].some(value => searchText(value).includes(term));
  });
}
