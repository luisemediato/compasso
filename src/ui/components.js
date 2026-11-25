import { escapeHtml } from '../domain/formatting.js';

const paths = {
  plus: 'M12 5v14 M5 12h14',
  edit: 'M16 3l5 5-12 12-6 1 1-6z M13 6l5 5',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  calendar: 'M4 5h16v16H4z M16 3v4 M8 3v4 M4 10h16 M8 14h2 M14 14h2 M8 18h2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  external: 'M14 3h7v7 M21 3l-11 11 M10 3H3v18h18v-7',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  music: 'M9 18V5l12-2v13 M9 8l12-2 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
};

export function icon(name) {
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="${paths[name]}"/></svg>`;
}

export function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

export function pageHeading(eyebrow, title, action, description = '') {
  return `<div class="page-heading"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p>
    <h1>${escapeHtml(title)}</h1>${description ? `<p class="page-description">${escapeHtml(description)}</p>` : ''}</div>${action}</div>`;
}

export function itemActions(item) {
  const title = escapeHtml(item.title);
  const id = escapeHtml(item.id);
  return `<span class="item-actions">
    <button type="button" data-edit="${id}" aria-label="Editar ${title}" title="Editar ${title}">${icon('edit')}</button>
    <button type="button" data-delete="${id}" aria-label="Excluir ${title}" title="Excluir ${title}">${icon('trash')}</button>
  </span>`;
}
