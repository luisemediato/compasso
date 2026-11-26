import { escapeHtml as e } from '../domain/formatting.js';
import { isPublicEvent, safeUrl } from '../domain/validation.js';
import { sortedEvents, upcoming } from '../domain/collections.js';
import { emptyState, itemActions } from './components.js';

const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function eventDetails(event, ticket) {
  const [year, month, day] = event.date.split('-');
  return `<div class="event-actions">
    <button type="button" data-event-details aria-haspopup="dialog" aria-label="Ver detalhes de ${e(event.title)}">Ver detalhes</button>
    <dialog aria-label="${e(event.title)}">
      <h2>${e(event.title)}</h2>
      <p><time datetime="${e(event.date)}">${e(day)}/${e(month)}/${e(year)}</time> às ${e(event.time)}</p>
      <p>${[event.venue, event.city].filter(Boolean).map(e).join(' · ')}</p>
      ${event.description ? `<p class="preserve-lines">${e(event.description)}</p>` : ''}
      ${ticket ? `<a href="${e(ticket)}" target="_blank" rel="noopener noreferrer">Ver ingressos</a>` : ''}
      <form method="dialog"><button autofocus>Fechar</button></form>
    </dialog></div>`;
}

export function renderEvents(events, editable = false, { publicFrom, newestFirst = false } = {}) {
  const listed = publicFrom ? upcoming(events.filter(isPublicEvent), publicFrom) : sortedEvents(events);
  if (newestFirst) listed.reverse();
  if (!listed.length) return emptyState('Nenhuma apresentação encontrada.');
  return `<ul class="event-list">${listed.map(event => {
    const [year, month, day] = String(event.date ?? '').split('-');
    const ticket = safeUrl(event.ticket);
    return `<li class="event-row">
      <time class="date-tile" datetime="${e(event.date)}" aria-label="${e(event.date)}">
        <span>${e(months[Number(month) - 1])}</span><b>${e(day)}</b><small>${e(year)}</small>
      </time>
      <div class="event-info">
        <p class="eyebrow">${e(event.type || 'Apresentação')}</p><h3>${e(event.title)}</h3>
        <p>${[event.time, event.venue, event.city].filter(Boolean).map(e).join(' · ')}</p>
        ${!publicFrom && event.description ? `<p class="preserve-lines">${e(event.description)}</p>` : ''}
        ${!publicFrom && ticket ? `<a href="${e(ticket)}" target="_blank" rel="noopener noreferrer">Ingressos</a>` : ''}
      </div>
      ${publicFrom ? eventDetails(event, ticket) : ''}
      ${editable ? `<div class="event-actions"><span>${isPublicEvent(event) ? 'Pública' : 'Privada'}</span>${itemActions(event)}</div>` : ''}
    </li>`;
  }).join('')}</ul>`;
}
