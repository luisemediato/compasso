import { escapeHtml as e } from '../domain/formatting.js';
import { isPublicEvent, normalizeInstagram } from '../domain/validation.js';
import { renderWorks } from '../ui/works.js';
import { renderEvents } from '../ui/events.js';

export function renderPortfolio(draft, preview = false) {
  const { profile, works, events } = draft;
  const instagram = normalizeInstagram(profile.instagram);
  return `<article class="portfolio">
    ${preview ? '<p>Prévia privada · apenas as apresentações públicas aparecem aqui.</p>' : ''}
    <h2>${e(profile.name)}</h2><p>${e(profile.instrument ?? '')} · ${e(profile.city ?? '')}</p>
    <p>${e(profile.headline ?? '')}</p><p class="preserve-lines">${e(profile.bio ?? '')}</p>
    ${profile.email ? `<a href="mailto:${e(profile.email)}">${e(profile.email)}</a>` : ''}
    ${instagram ? `<a href="${e(instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}
    <h3>Trabalhos</h3>${renderWorks(works)}
    <h3>Agenda pública</h3>${renderEvents(events.filter(isPublicEvent))}
  </article>`;
}
