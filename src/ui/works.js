import { escapeHtml as e } from '../domain/formatting.js';
import { safeUrl } from '../domain/validation.js';
import { emptyState } from './components.js';

export function renderWorks(works, editable = false) {
  if (!works.length) return emptyState('Nenhum trabalho cadastrado.');
  return `<ul class="cards">${works.map(work => `<li>
    <h3>${e(work.title)}</h3><p>${e(work.type ?? '')}</p><p>${e(work.description ?? '')}</p>
    ${safeUrl(work.url) ? `<a href="${e(safeUrl(work.url))}" target="_blank" rel="noopener noreferrer">Abrir trabalho</a>` : ''}
    ${editable ? `<button type="button" data-edit="${e(work.id)}">Editar ${e(work.title)}</button>
      <button type="button" data-delete="${e(work.id)}">Excluir ${e(work.title)}</button>` : ''}
  </li>`).join('')}</ul>`;
}
