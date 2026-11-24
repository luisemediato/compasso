import { suggestSlug } from '../domain/account.js';
import { escapeHtml } from '../domain/formatting.js';

export function field(name, label, value = '', { type = 'text', required = false, max = 4000 } = {}) {
  const attrs = `name="${name}" ${required ? 'required' : ''} maxlength="${max}"`;
  const input = type === 'textarea'
    ? `<textarea ${attrs}>${escapeHtml(value)}</textarea>`
    : `<input ${attrs} type="${type}" value="${escapeHtml(value)}">`;
  return `<label>${label}${input}</label>`;
}

export function formActions(label = 'Salvar') {
  return `<p data-error role="alert" tabindex="-1"></p><button type="submit">${label}</button>`;
}

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
