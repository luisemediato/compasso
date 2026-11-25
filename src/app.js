import { localDate } from './domain/formatting.js';
import { routeFromPath } from './domain/routes.js';
import { renderHome } from './pages/home.js';
import { emptyState } from './ui/components.js';
import { renderShell, updateShell } from './ui/shell.js';
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
import { bindCalendar } from './ui/calendar.js';
import { renderEvents } from './ui/events.js';
import { filterEvents } from './domain/collections.js';
import { renderPortfolio } from './pages/portfolio.js';
import { renderPublication } from './pages/publication.js';
import { renderContact } from './pages/contact.js';
import { bindArtistSearch, renderArtistList, renderExplore } from './pages/explore.js';
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

  function reportError(error, target = notice) {
    target.textContent = error.message;
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
      target.append(reload);
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
      if (!field) return;
      field.setAttribute('aria-invalid', 'true');
      const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
      descriptions.add(target.id);
      field.setAttribute('aria-describedby', [...descriptions].join(' '));
    }
    // O servidor não distingue a colisão de e-mail da colisão de slug.
    if (error.status === 409 && form.elements.namedItem('slug')) {
      for (const name of ['email', 'slug']) mark(name);
    }
    if (error.status === 409 && state) reportError(error, form.closest('dialog') ? target : notice);
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
      const cancel = form.querySelector('[data-cancel]');
      if (cancel) cancel.disabled = true;
      notice.textContent = '';
      form.querySelector('[data-error]').textContent = '';
      for (const field of form.querySelectorAll('[aria-invalid]')) {
        field.removeAttribute('aria-invalid');
        const help = field.getAttribute('aria-describedby').split(' ').filter(id => id !== 'form-feedback').join(' ');
        if (help) field.setAttribute('aria-describedby', help);
        else field.removeAttribute('aria-describedby');
      }
      run(async () => {
        try {
          await handler(Object.fromEntries(new window.FormData(form)), () => version === pageVersion);
        } catch (error) {
          if (version === pageVersion) showError(form, error);
        } finally {
          button.disabled = false;
          if (cancel) cancel.disabled = false;
        }
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

  function scrollToSection(hash, smooth = false) {
    if (!hash.startsWith('#portfolio-')) return false;
    const section = window.document.getElementById(hash.slice(1));
    if (!section) return false;
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView?.({ behavior: smooth && !reduce ? 'smooth' : 'instant' });
    return true;
  }

  async function renderCurrentPage() {
    pageVersion++;
    const version = pageVersion;
    let route = routeFromPath(window.location.pathname);
    updateShell(app, state, route);
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
      const date = localDate();
      main.innerHTML = renderDashboard(state, date);
      bindCalendar(main.querySelector('[data-calendar]'), date, state.events);
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
      main.innerHTML = isAgenda ? renderAgenda(state.events, localDate()) : renderWorksPage(state.works);
      const collection = isAgenda ? 'events' : 'works';
      bindCollection({ main, window, collection, getItems: () => state[collection],
        validate: isAgenda ? validateEvent : validateWork,
        bindForm, save: saveDraft, refresh: renderCurrentPage, run });
      if (isAgenda) {
        bindCalendar(main.querySelector('[data-calendar]'), localDate(), state.events, main.querySelector('[name="date"]'));
        const filters = main.querySelector('[data-agenda-filter]');
        filters.addEventListener('input', () => {
          const period = filters.querySelector('[name="period"]:checked').value;
          const date = localDate();
          let events = filterEvents(state.events, filters.querySelector('[name="filter"]').value);
          if (period === 'upcoming') events = events.filter(event => event.date >= date);
          if (period === 'past') events = events.filter(event => event.date < date);
          main.querySelector('[data-list]').innerHTML = renderEvents(events, true);
        });
      }
      const url = new URL(window.location.href);
      if (url.searchParams.get('novo') === '1') {
        url.searchParams.delete('novo');
        window.history.replaceState(null, '', url);
        main.querySelector('[data-new]').click();
      }
    } else if (route === 'preview') {
      main.innerHTML = renderPortfolio(state, true);
      scrollToSection(window.location.hash);
    } else if (route === 'publication') {
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
      main.querySelector('[data-demo]').addEventListener('click', ({ currentTarget: button }) => {
        const demo = main.querySelector('[data-demo-content]');
        if (!demo.hasChildNodes()) demo.innerHTML = renderPortfolio(seed, false, true);
        demo.hidden = !demo.hidden;
        button.setAttribute('aria-expanded', String(!demo.hidden));
        button.textContent = demo.hidden ? 'Ver perfil de demonstração' : 'Ocultar demonstração';
      });
      await bindArtistSearch(main, { api, window, run });
    } else if (route?.startsWith('artist/')) {
      main.innerHTML = emptyState('Carregando portfólio…');
      try {
        const artists = await api('/api/artists');
        if (version !== pageVersion) return;
        const artist = artists.find(item => item.slug === route.slice(7));
        main.innerHTML = artist ? renderPortfolio(artist) : emptyState('Portfólio não encontrado.');
        app.classList.toggle('portfolio-page', Boolean(artist));
        if (artist) scrollToSection(window.location.hash);
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
    const details = event.target.closest?.('[data-event-details]');
    if (details) {
      details.nextElementSibling.showModal();
      return;
    }
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return;
    if (url.hash) {
      if (url.pathname === window.location.pathname && url.search === window.location.search && scrollToSection(url.hash, true)) {
        event.preventDefault();
        if (window.location.hash) window.history.replaceState(null, '', url.pathname + url.search);
      }
      return;
    }
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
    updateShell(app, state, routeFromPath(window.location.pathname));
    if (version === sessionVersion && privateRoutes.has(routeFromPath(window.location.pathname))) await renderCurrentPage();
    await initialRender;
  });
  return { ready, idle: () => pending };
}
