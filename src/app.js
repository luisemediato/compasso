import { routeFromPath } from './domain/routes.js';
import { renderHome } from './pages/home.js';
import { emptyState } from './ui/components.js';
import { renderShell } from './ui/shell.js';

const pendingPages = new Map([
  ['explore', 'Explorar estará disponível em breve.'],
  ['login', 'A entrada de músicos estará disponível em breve.'],
  ['register', 'O cadastro estará disponível em breve.'],
]);

export function startApp(window) {
  const app = window.document.querySelector('#app');
  app.innerHTML = renderShell();
  const main = app.querySelector('main');

  function renderCurrentPage() {
    const route = routeFromPath(window.location.pathname);

    if (route === 'home') {
      main.innerHTML = renderHome();
      return;
    }

    const message = pendingPages.get(route) ?? 'Página indisponível.';
    main.innerHTML = emptyState(message);
  }

  app.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') ||
        (link.target && link.target !== '_self')) {
      return;
    }

    const url = new URL(link.href);
    if (url.origin !== window.location.origin || url.hash) {
      return;
    }

    event.preventDefault();
    if (url.href !== window.location.href) {
      window.history.pushState(null, '', url.href);
    }
    renderCurrentPage();
  });

  window.addEventListener('popstate', renderCurrentPage);
  renderCurrentPage();
}
