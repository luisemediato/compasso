import { escapeHtml } from '../domain/formatting.js';

const paths = {
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  music: 'M9 18V5l12-2v13 M9 8l12-2 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
};

export function icon(name) {
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[name]}"/></svg>`;
}

export function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}
