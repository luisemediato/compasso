import { escapeHtml as e } from '../domain/formatting.js';
import { safeUrl } from '../domain/validation.js';
import { sortedEvents } from '../domain/collections.js';
import { emptyState } from './components.js';

export function renderEvents(events, editable = false) {
  if (!events.length) return emptyState('Nenhuma apresentação encontrada.');
  return `<ul class="cards">${sortedEvents(events).map(event => `<li>
    <h3>${e(event.title)}</h3><p><time datetime="${e(event.date)}">${e(event.date)}</time> · ${e(event.time)}</p>
    <p>${e(event.venue)} · ${e(event.city ?? '')}</p><p>${e(event.type ?? '')}</p><p>${e(event.description ?? '')}</p>
    ${safeUrl(event.ticket) ? `<a href="${e(safeUrl(event.ticket))}" target="_blank" rel="noopener noreferrer">Ingressos</a>` : ''}
    ${editable ? `<p>${event.visibility === 'public' ? 'Pública' : 'Privada'}</p>
      <button type="button" data-edit="${e(event.id)}">Editar ${e(event.title)}</button>
      <button type="button" data-delete="${e(event.id)}">Excluir ${e(event.title)}</button>` : ''}
  </li>`).join('')}</ul>`;
}
