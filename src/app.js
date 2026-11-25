import { routeFromPath } from './domain/routes.js';
import { renderHome } from './pages/home.js';
import { emptyState } from './ui/components.js';
import { renderShell } from './ui/shell.js';
import { renderLogin, renderRegister } from './pages/account.js';
import { bindSlugSuggestion } from './ui/forms.js';
import { createApi } from './data/api.js';
import { accountError } from './domain/account.js';
import { renderProfile } from './pages/profile.js';
import { renderDashboard } from './pages/dashboard.js';
import { validateProfile, validateWork, validateEvent } from './domain/validation.js';
import { renderWorksPage } from './pages/works.js';
import { bindCollection } from './ui/collection-editor.js';
import { renderAgenda } from './pages/agenda.js';
import { renderCalendar } from './ui/calendar.js';
import { renderEvents } from './ui/events.js';
import { filterEvents } from './domain/collections.js';
import { renderPortfolio } from './pages/portfolio.js';
import { renderPublication } from './pages/publication.js';
import { renderContact } from './pages/contact.js';
import { renderArtistList, renderExplore } from './pages/explore.js';
import { seed } from './data/seed.js';
import { createRepository } from './data/repository.js';

const privateRoutes = new Set(['dashboard', 'profile', 'works', 'agenda', 'preview', 'publication']);

export function startApp(window, { api = createApi(window.fetch?.bind(window)) } = {}) {
  const app = window.document.querySelector('#app');
  app.innerHTML = renderShell();
  const main = app.querySelector('main');
  const notice = app.querySelector('[data-notice]');
  let state = null;
  let restored = false;
  let pageVersion = 0;
  let renderedPath;
  let pending = Promise.resolve();
  let sessionVersion = 0;

  function run(action) {
    pending = action().catch(error => { reportError(error); });
    return pending;
  }

  function reportError(error) {
    notice.textContent = error.message;
    if (error.status === 409 && state) {
      const reload = window.document.createElement('button');
      reload.type = 'button';
      reload.dataset.reload = '';
      reload.textContent = 'Recarregar rascunho';
      reload.addEventListener('click', () => {
        if (!window.confirm('Descartar as alterações desta tela e carregar o rascunho salvo?')) return;
        run(async () => {
          state = await api('/api/session');
          notice.textContent = '';
          await renderCurrentPage();
        });
      });
      notice.append(reload);
    }
  }

  function go(path, replace = false) {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', path);
    return renderCurrentPage();
  }

  function showError(form, error) {
    const target = form.querySelector('[data-error]');
    target.id = 'form-feedback';
    target.textContent = error.message;
    target.focus();
    function mark(name) {
      const field = form.elements.namedItem(name);
      field?.setAttribute('aria-invalid', 'true');
      field?.setAttribute('aria-describedby', target.id);
    }
    // O servidor não distingue a colisão de e-mail da colisão de slug.
    if (error.status === 409 && form.elements.namedItem('slug')) {
      for (const name of ['email', 'slug']) mark(name);
    }
    if (error.status === 409 && state) reportError(error);
    const fields = { 'nome artístico': 'name', instrumento: 'instrument', trajetória: 'bio', Instagram: 'instagram', senha: 'password', endereço: 'slug', 'e-mail': 'email', título: 'title', horário: 'time', data: 'date', local: 'venue', link: 'url' };
    for (const [word, name] of Object.entries(fields)) {
      if (error.message.includes(word)) mark(name);
    }
  }

  function bindForm(handler) {
    const form = main.querySelector('form');
    const version = pageVersion;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const button = form.querySelector('[type="submit"]');
      if (button.disabled) return;
      button.disabled = true;
      notice.textContent = '';
      form.querySelector('[data-error]').textContent = '';
      form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
      run(async () => {
        try {
          await handler(Object.fromEntries(new window.FormData(form)), () => version === pageVersion);
        } catch (error) {
          if (version === pageVersion) showError(form, error);
        } finally { button.disabled = false; }
      });
    });
  }

  async function saveDraft(changes) {
    const { id, revision, profile, works, events } = state;
    return mutate('/api/draft', { id, revision, profile, works, events, ...changes });
  }

  async function mutate(path, body) {
    const version = sessionVersion;
    try {
      const saved = await api(path, body);
      if (version === sessionVersion && state?.id === body.id && state.revision === body.revision) state = saved;
      return saved;
    } catch (error) {
      if (error.status === 401 && version === sessionVersion) {
        state = null;
        sessionVersion++;
        await go('/entrar');
        reportError(error);
      }
      throw error;
    }
  }

  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function updateSessionNavigation() {
    app.querySelector('[data-private]').hidden = !state;
    app.querySelector('[data-guest]').hidden = Boolean(state);
    app.querySelector('[data-member]').hidden = !state;
    const homeAccount = main.querySelector('[data-home-account]');
    if (homeAccount) homeAccount.href = state ? '/painel' : '/cadastro';
  }

  async function renderCurrentPage() {
    pageVersion++;
    const version = pageVersion;
    let route = routeFromPath(window.location.pathname);
    updateSessionNavigation();
    if (privateRoutes.has(route) && !state) {
      if (!restored) { main.innerHTML = emptyState('Restaurando sessão…'); return; }
      window.history.replaceState(null, '', '/entrar');
      route = 'login';
    }
    renderedPath = window.location.pathname;
    main.dataset.view = route;
    app.classList.toggle('portfolio-page', route === 'preview');
    if (route === 'home') {
      main.innerHTML = renderHome(Boolean(state));
      // O destino pertence a esta renderização, mesmo se o visitante navegar durante a leitura.
      const featured = main.querySelector('[data-featured]');
      try {
        const artists = await api('/api/artists');
        featured.innerHTML = renderArtistList(artists.slice(0, 3), 'Ainda não há portfólios publicados.');
      } catch {
        featured.textContent = 'Não foi possível carregar os músicos. Tente novamente em instantes.';
      }
    } else if (route === 'register' || route === 'login') {
      main.innerHTML = route === 'register' ? renderRegister() : renderLogin();
      if (route === 'register') bindSlugSuggestion(main.querySelector('form'));
      bindForm(async (data, current) => {
        const body = route === 'register' ? { ...data, name: data.artistName } : data;
        const reason = route === 'register' ? accountError(body) : '';
        if (reason) throw new Error(reason);
        sessionVersion++;
        await api(route === 'register' ? '/api/register' : '/api/login', body);
        const session = await api('/api/session');
        if (!current()) return;
        if (!session) throw new Error('Entre novamente para abrir sua conta.');
        state = session;
        notice.textContent = '';
        await go('/painel');
      });
    } else if (route === 'dashboard') {
      main.innerHTML = renderDashboard(state, today());
      main.querySelector('[data-import]').addEventListener('click', () => run(async () => {
        const repository = createRepository(window.localStorage);
        const imported = await repository.importDraft(state, {
          confirm: message => window.confirm(message),
          save: body => mutate('/api/draft', body),
        });
        notice.textContent = imported ? 'Rascunho importado. A publicação foi preservada.' : 'Nenhum rascunho importado.';
        if (version === pageVersion) await renderCurrentPage();
      }));
    } else if (route === 'profile') {
      main.innerHTML = renderProfile(state.profile);
      bindForm(async (profile, current) => {
        const reason = validateProfile(profile, { requireInstrument: false });
        if (reason) throw new Error(reason);
        await saveDraft({ profile });
        if (current()) {
          notice.textContent = 'Perfil salvo.';
          await renderCurrentPage();
        }
      });
    } else if (route === 'works' || route === 'agenda') {
      const isAgenda = route === 'agenda';
      main.innerHTML = isAgenda ? renderAgenda(state.events, today()) : renderWorksPage(state.works);
      const collection = isAgenda ? 'events' : 'works';
      bindCollection({ main, window, collection, getItems: () => state[collection],
        validate: isAgenda ? validateEvent : validateWork,
        bindForm, save: saveDraft, refresh: renderCurrentPage, run });
      if (isAgenda) {
        let [year, month] = today().split('-').map(Number);
        month--;
        const calendar = main.querySelector('[data-calendar]');
        calendar.addEventListener('click', event => {
          const day = event.target.closest('[data-day]');
          const move = event.target.closest('[data-month]');
          if (day) main.querySelector('[name="date"]').value = day.dataset.day;
          if (move) {
            month += Number(move.dataset.month);
            if (month < 0) { year--; month = 11; }
            if (month > 11) { year++; month = 0; }
          }
          calendar.innerHTML = renderCalendar(year, month, main.querySelector('[name="date"]').value);
        });
        main.querySelector('[name="filter"]').addEventListener('input', event => {
          main.querySelector('[data-list]').innerHTML = renderEvents(filterEvents(state.events, event.target.value), true);
        });
      }
    } else if (route === 'preview') main.innerHTML = renderPortfolio(state, true);
    else if (route === 'publication') {
      main.innerHTML = renderPublication(state);
      for (const action of ['publish', 'unpublish']) {
        main.querySelector(`[data-${action}]`)?.addEventListener('click', event => {
          const button = event.currentTarget;
          if (button.disabled || (action === 'unpublish' && !window.confirm('Retirar o portfólio público? Seu rascunho será preservado.'))) return;
          button.disabled = true;
          run(async () => {
            try {
              const { id, revision } = state;
              await mutate(`/api/${action}`, { id, revision });
              if (version !== pageVersion) return;
              notice.textContent = action === 'publish' ? 'Portfólio publicado.' : 'Publicação retirada.';
              await renderCurrentPage();
            } finally { button.disabled = false; }
          });
        });
      }
    } else if (route === 'contact') {
      main.innerHTML = renderContact();
      bindForm(async (data, current) => {
        await api('/api/contact', data);
        if (current()) {
          main.querySelector('form').reset();
          main.querySelector('[data-error]').textContent = '';
          notice.textContent = 'Mensagem recebida pela equipe.';
        }
      });
    } else if (route === 'explore') {
      main.innerHTML = renderExplore();
      let searchVersion = 0;
      main.querySelector('[data-demo]').addEventListener('click', ({ currentTarget: button }) => {
        const demo = main.querySelector('[data-demo-content]');
        if (!demo.hasChildNodes()) demo.innerHTML = renderPortfolio(seed, false, true);
        demo.hidden = !demo.hidden;
        button.setAttribute('aria-expanded', String(!demo.hidden));
        button.textContent = demo.hidden ? 'Ver perfil de demonstração' : 'Ocultar demonstração';
      });
      const search = async (query = {}) => {
        const requestVersion = ++searchVersion;
        const artists = await api('/api/artists?' + new URLSearchParams(query));
        if (version !== pageVersion) return;
        if (requestVersion === 1) {
          const instruments = artists.map(artist => artist.profile.instrument).filter(Boolean);
          const options = [...new Set(instruments)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
          main.querySelector('datalist').replaceChildren(...options.map(value => new window.Option(value, value)));
        }
        if (requestVersion === searchVersion) main.querySelector('[data-results]').innerHTML = renderArtistList(artists);
      };
      bindForm(search);
      try { await search(); } catch (error) {
        if (version === pageVersion) main.querySelector('[data-results]').textContent = error.message;
      }
    } else if (route?.startsWith('artist/')) {
      main.innerHTML = emptyState('Carregando portfólio…');
      try {
        const artists = await api('/api/artists');
        if (version !== pageVersion) return;
        const artist = artists.find(item => item.slug === route.slice(7));
        main.innerHTML = artist ? renderPortfolio(artist) : emptyState('Portfólio não encontrado.');
        app.classList.toggle('portfolio-page', Boolean(artist));
        if (artist && window.location.hash.startsWith('#portfolio-')) {
          window.document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
        }
      } catch (error) {
        if (version === pageVersion) main.innerHTML = emptyState(error.message);
      }
    }
    else main.innerHTML = emptyState('Página indisponível.');
  }

  app.querySelector('[data-logout]').addEventListener('click', () => run(async () => {
    await api('/api/logout', {});
    sessionVersion++;
    state = null;
    notice.textContent = '';
    await go('/entrar');
  }));

  app.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || url.hash) return;
    event.preventDefault();
    if (url.href !== window.location.href) window.history.pushState(null, '', url.href);
    run(renderCurrentPage);
    main.focus();
  });
  window.addEventListener('popstate', () => {
    if (window.location.pathname !== renderedPath) run(renderCurrentPage);
  });
  const initialRender = renderCurrentPage();
  const ready = run(async () => {
    const version = sessionVersion;
    try {
      const restoredState = await api('/api/session');
      if (version === sessionVersion) state = restoredState;
    }
    catch (error) { notice.textContent = error.message; }
    restored = true;
    // Não apaga campos digitados enquanto a sessão estava carregando.
    updateSessionNavigation();
    if (version === sessionVersion && privateRoutes.has(routeFromPath(window.location.pathname))) await renderCurrentPage();
    await initialRender;
  });
  return { ready, idle: () => pending };
}
