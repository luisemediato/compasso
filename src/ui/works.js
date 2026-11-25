import { escapeHtml as e } from '../domain/formatting.js';
import { safeUrl } from '../domain/validation.js';
import { emptyState, icon, itemActions } from './components.js';

export function renderWorks(works, editable = false) {
  if (!works.length) return emptyState('Nenhum trabalho cadastrado.');
  return `<ul class="work-grid">${works.map(work => {
    const url = safeUrl(work.url);
    return `<li class="work-card">
      <div class="work-art" aria-hidden="true">${icon('music')}</div>
      <div class="work-body"><p class="eyebrow">${e(work.type)}</p><h3>${e(work.title)}</h3>
        <p class="preserve-lines">${e(work.description)}</p>
        <div class="work-actions">
          ${url ? `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">Abrir trabalho ${icon('external')}</a>` : ''}
          ${editable ? itemActions(work) : ''}
        </div>
      </div></li>`;
  }).join('')}</ul>`;
}
