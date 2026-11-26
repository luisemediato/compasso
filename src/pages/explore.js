import { escapeHtml as e, initials } from '../domain/formatting.js';
import { emptyState, icon } from '../ui/components.js';

export function renderArtistList(artists, emptyMessage = 'Nenhum músico encontrado.') {
  if (!artists.length) return emptyState(emptyMessage);
  return `<ul class="artist-grid">${artists.map(({ slug, profile }) => `<li>
    <a class="artist-card" href="/${e(slug)}" aria-label="${e(profile.name)}">
      <div class="artist-cover" aria-hidden="true">${e(initials(profile.name))}${icon('music')}</div>
      <div class="artist-body">
        <p class="eyebrow">${e(profile.instrument)}</p><h3>${e(profile.name)}</h3>
        <p>${e(profile.city || 'Cidade não informada')}</p><small>Portfólio publicado</small>
        <span class="artist-open">Conhecer artista ${icon('arrow')}</span>
      </div>
    </a></li>`).join('')}</ul>`;
}

export function renderExplore() {
  return `<div class="public-section explore-page">
    <p class="eyebrow">Descubra o próximo encontro</p><h1>Encontre sua próxima escuta.</h1>
    <p class="intro">Conheça músicos, seus trabalhos e suas próximas apresentações.</p>
    <form class="discovery-tools" role="search">
      <label>Nome, instrumento ou cidade<input type="search" name="q" placeholder="Quem você quer ouvir?"></label>
      <label>Instrumento<select name="instrument"><option value="">Todos os instrumentos</option></select></label>
    </form>
    <div data-results aria-live="polite">Carregando músicos…</div>
    <section class="demo-section" aria-labelledby="titulo-demo">
      <h2 id="titulo-demo">Catálogo de demonstração</h2><p>Exemplo fictício, separado dos músicos publicados.</p>
      <button type="button" data-demo aria-controls="perfil-demo" aria-expanded="false">Ver perfil de demonstração</button>
      <div id="perfil-demo" data-demo-content hidden></div>
    </section></div>`;
}

export function bindArtistSearch(main, { api, window, run }) {
  const form = main.querySelector('[role="search"]');
  const results = main.querySelector('[data-results]');
  const instrument = form.elements.instrument;
  let latestSearch = 0;
  let latestCatalog = 0;

  async function search(params = new URLSearchParams()) {
    const request = ++latestSearch;
    const fullCatalog = !params.get('q') && !params.get('instrument');
    if (fullCatalog) latestCatalog = request;
    try {
      const artists = await api('/api/artists?' + params);
      // A primeira resposta também fornece os instrumentos quando a pessoa já digitou.
      if (fullCatalog && request === latestCatalog && !instrument.value) {
        const values = artists.map(artist => artist.profile.instrument?.trim()).filter(Boolean);
        const sorted = [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        instrument.replaceChildren(instrument.options[0], ...sorted.map(value => new window.Option(value, value)));
      }
      if (request === latestSearch) results.innerHTML = renderArtistList(artists);
    } catch (error) {
      if (request === latestSearch) results.textContent = error.message;
    }
  }

  function update() {
    return run(() => search(new URLSearchParams(new window.FormData(form))));
  }
  form.elements.q.addEventListener('input', update);
  instrument.addEventListener('change', update);
  form.addEventListener('submit', event => {
    event.preventDefault();
    update();
  });
  return search();
}
