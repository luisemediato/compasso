import { escapeHtml as e } from '../domain/formatting.js';
import { isPublicEvent, safeUrl } from '../domain/validation.js';
import { sortedEvents } from '../domain/collections.js';
import { emptyState, itemActions } from './components.js';

const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function renderEvents(events, editable = false) {
  if (!events.length) return emptyState('Nenhuma apresentação encontrada.');
  return `<ul class="event-list">${sortedEvents(events).map(event => {
    const [year, month, day] = String(event.date ?? '').split('-');
    const ticket = safeUrl(event.ticket);
    return `<li class="event-row">
      <time class="date-tile" datetime="${e(event.date)}" aria-label="${e(event.date)}">
        <span>${e(months[Number(month) - 1])}</span><b>${e(day)}</b><small>${e(year)}</small>
      </time>
      <div class="event-info">
        <p class="eyebrow">${e(event.type)}</p><h3>${e(event.title)}</h3>
        <p>${[event.time, event.venue, event.city].filter(Boolean).map(e).join(' · ')}</p>
        <p class="preserve-lines">${e(event.description)}</p>
        ${ticket ? `<a href="${e(ticket)}" target="_blank" rel="noopener noreferrer">Ingressos</a>` : ''}
      </div>
      ${editable ? `<div class="event-actions"><span>${isPublicEvent(event) ? 'Pública' : 'Privada'}</span>${itemActions(event)}</div>` : ''}
    </li>`;
  }).join('')}</ul>`;
}
