import { escapeHtml } from '../domain/formatting.js';

export function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}
