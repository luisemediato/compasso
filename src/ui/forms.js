import { suggestSlug } from '../domain/account.js';

export function bindSlugSuggestion(form) {
  const artist = form.elements.namedItem('artistName');
  const slug = form.elements.namedItem('slug');
  let edited = false;

  slug.addEventListener('input', () => {
    edited = true;
  });

  artist.addEventListener('input', () => {
    if (!edited) slug.value = suggestSlug(artist.value);
  });
}
