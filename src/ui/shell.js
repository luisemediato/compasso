import { escapeHtml, initials, localDate } from '../domain/formatting.js';
import { upcoming } from '../domain/collections.js';
import { pathFromRoute } from '../domain/routes.js';
import { hasUnpublishedChanges } from '../domain/publication.js';
import { icon } from './components.js';

const workspacePages = {
  dashboard: ['Painel', 'grid'],
  profile: ['Perfil', 'user'],
  works: ['Trabalhos', 'music'],
  agenda: ['Agenda', 'calendar'],
  preview: ['Prévia', 'eye'],
  publication: ['Publicação', 'external'],
};

function brand() {
  return `<a class="brand" href="/" aria-label="Compasso início">
    <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="brand-text">compasso<small>Espaço para sua música</small></span>
  </a>`;
}

const publicTitles = {
  explore: 'Explorar músicos', login: 'Entrar', register: 'Criar conta', contact: 'Contato',
};

export function pageTitle(route) {
  if (route === 'home') return 'Compasso';
  const label = workspacePages[route]?.[0] ?? publicTitles[route];
  return (label || (route?.startsWith('artist/') ? 'Portfólio' : 'Página indisponível')) + ' | Compasso';
}

function sidebar(state, route) {
  const profile = state.profile;
  const count = upcoming(state.events, localDate()).length;
  const menu = [
    ['dashboard', 'Visão geral', 'grid'],
    ['profile', 'Meu perfil', 'user'],
    ['works', 'Meus trabalhos', 'music'],
    ['agenda', 'Minha agenda', 'calendar'],
    ['publication', 'Meu portfólio', 'eye'],
  ];
  const links = menu.map(([page, label, symbol]) => `
    <a href="${pathFromRoute(page)}" aria-label="${label}" title="${label}" ${page === 'agenda' ? `aria-description="Apresentações de hoje em diante: ${count}"` : ''} ${page === route ? 'aria-current="page"' : ''}>
      ${icon(symbol)}<span>${label}</span>${page === 'agenda' ? `<span class="nav-count" aria-hidden="true">${count}</span>` : ''}
    </a>`).join('');
  return `${brand()}<p class="sidebar-label">Meu espaço</p>
    <nav class="side-nav" aria-label="Área do músico">${links}</nav>
    <div class="side-bottom">
      <div class="side-discovery">
        <span class="side-spark" aria-hidden="true">✧</span>
        <strong>O próximo encontro está lá fora.</strong>
        <p>Conheça novas histórias e outros jeitos de fazer música.</p>
        <a class="side-explore" href="/explorar">Explorar músicos ${icon('arrow')}</a>
      </div>
      <div class="side-profile"><span class="avatar" aria-hidden="true">${escapeHtml(initials(profile.name))}</span>
        <div><b>${escapeHtml(profile.name)}</b><small>${escapeHtml(profile.instrument)}</small></div>
      </div>
    </div>`;
}

export function renderShell() {
  return `
    <header class="public-header">
      ${brand()}
      <nav class="public-links site-links" aria-label="Navegação principal">
        <a href="/">Início</a><a href="/explorar">Explorar músicos</a><a href="/contato">Contato</a>
      </nav>
      <nav class="public-links portfolio-links" aria-label="Seções do portfólio">
        <a href="#portfolio-sobre">Sobre</a><a href="#portfolio-trabalhos">Trabalhos</a>
        <a href="#portfolio-agenda">Agenda</a><a href="#portfolio-contato">Contato</a>
        <a class="portfolio-explore" href="/explorar">Explorar músicos</a>
      </nav>
      <div class="breadcrumb"><a href="/">Início</a><span aria-hidden="true">›</span><b data-current-page></b></div>
      <div class="account-links" data-guest><a href="/entrar">Entrar</a><a class="btn" href="/cadastro">Criar conta</a></div>
      <div class="account-links" data-member hidden>
        <a class="btn light return-workspace" href="/painel">Meu espaço criativo</a>
        <span class="workspace-tools publication-state" data-publication-state></span>
        <a class="workspace-tools" href="/previa" aria-label="Visualizar prévia">${icon('eye')}</a>
        <button type="button" data-logout>Sair</button>
      </div>
    </header>
    <div data-notice role="status"></div>
    <aside class="sidebar" data-private hidden></aside>
    <main id="conteudo" tabindex="-1"></main>
    <footer class="public-footer"><span>compasso · Um espaço para a sua música.</span><a href="/contato">Fale com a equipe</a></footer>
  `;
}

export function updateShell(app, state, route) {
  const workspace = Boolean(state && route !== 'preview' && Object.hasOwn(workspacePages, route));
  app.classList.toggle('is-workspace', workspace);
  const footer = app.querySelector('.public-footer');
  const footerText = footer.querySelector('span');
  const footerLink = footer.querySelector('a');
  footerText.textContent = workspace
    ? 'Feito para quem vive de música. Feito para você.'
    : 'compasso · Um espaço para a sua música.';

  footerLink.textContent = workspace
    ? `compasso © ${new Date().getFullYear()} · Voltar ao início`
    : 'Fale com a equipe';

  footerLink.href = workspace ? '/' : '/contato';
  const side = app.querySelector('[data-private]');
  side.hidden = !workspace;
  side.innerHTML = workspace ? sidebar(state, route) : '';
  app.querySelector('[data-current-page]').textContent = workspace ? workspacePages[route][0] : '';
  let status = '';
  if (workspace) {
    status = 'Rascunho · não publicado';
    if (state.publication) status = hasUnpublishedChanges(state, state.publication) ? 'Alterações no rascunho' : 'Versão publicada';
  }
  app.querySelector('[data-publication-state]').textContent = status;
  app.querySelector('[data-guest]').hidden = Boolean(state);
  app.querySelector('[data-member]').hidden = !state;
  const homeAccount = app.querySelector('[data-home-account]');
  if (homeAccount) homeAccount.href = state ? '/painel' : '/cadastro';
}
