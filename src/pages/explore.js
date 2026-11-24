import { escapeHtml as e } from '../domain/formatting.js';
import { emptyState } from '../ui/components.js';
import { field, formActions } from '../ui/forms.js';

export function renderArtistList(artists) {
  if (!artists.length) return emptyState('Nenhum músico encontrado.');
  return `<ul class="cards">${artists.map(({ slug, profile }) => `<li>
    <h3><a href="/${e(slug)}">${e(profile.name)}</a></h3>
    <p>${e(profile.instrument ?? '')} · ${e(profile.city ?? '')}</p>
  </li>`).join('')}</ul>`;
}

export function renderExplore() {
  return `<h2>Explorar</h2><form role="search">
    ${field('q', 'Nome, cidade ou instrumento')}${field('instrument', 'Filtrar por instrumento')}
    ${formActions('Buscar')}
    </form><div data-results aria-live="polite">Carregando músicos…</div>
    <section aria-label="Catálogo de demonstração"><h3>Catálogo de demonstração</h3>
      <p>Exemplo fictício, separado dos músicos publicados.</p>
      <button type="button" data-demo>Ver perfil de demonstração</button><div data-demo-content></div>
    </section>`;
}
