import { escapeHtml as e, initials } from '../domain/formatting.js';
import { emptyState, icon } from '../ui/components.js';
import { field, formActions } from '../ui/forms.js';

export function renderArtistList(artists, emptyMessage = 'Nenhum músico encontrado.') {
  if (!artists.length) return emptyState(emptyMessage);
  return `<ul class="artist-grid">${artists.map(({ slug, profile }) => `<li>
    <a class="artist-card" href="/${e(slug)}" aria-label="${e(profile.name)}">
      <div class="artist-cover" aria-hidden="true">${e(initials(profile.name))}${icon('music')}</div>
      <div class="artist-body">
        <p class="eyebrow">Portfólio publicado</p><h3>${e(profile.name)}</h3>
        <p>${e(profile.instrument)} · ${e(profile.city || 'Cidade não informada')}</p>
        <span class="artist-open">Conhecer artista ${icon('arrow')}</span>
      </div>
    </a></li>`).join('')}</ul>`;
}

export function renderExplore() {
  return `<div class="public-section explore-page">
    <p class="eyebrow">Descubra o próximo encontro</p><h1>Encontre sua próxima escuta.</h1>
    <p class="intro">Conheça músicos, seus trabalhos e suas próximas apresentações.</p>
    <form class="discovery-tools" role="search">
      ${field('q', 'Nome, cidade ou instrumento', '', { type: 'search' })}
      <label>Filtrar por instrumento<input name="instrument" list="instrumentos-publicados" placeholder="Todos os instrumentos"></label>
      <datalist id="instrumentos-publicados"></datalist>
      ${formActions('Buscar')}
    </form>
    <div data-results aria-live="polite">Carregando músicos…</div>
    <section class="demo-section" aria-labelledby="titulo-demo">
      <h2 id="titulo-demo">Catálogo de demonstração</h2><p>Exemplo fictício, separado dos músicos publicados.</p>
      <button type="button" data-demo aria-controls="perfil-demo" aria-expanded="false">Ver perfil de demonstração</button>
      <div id="perfil-demo" data-demo-content hidden></div>
    </section></div>`;
}
