import { escapeHtml } from '../domain/formatting.js';
import { hasUnpublishedChanges } from '../domain/publication.js';

export function renderPublication(state) {
  const published = Boolean(state.publication);
  return `<h2>Publicação</h2>
    <p>${published ? 'Portfólio publicado.' : 'Portfólio ainda não publicado.'}</p>
    <p>${hasUnpublishedChanges(state, state.publication) ? 'Alterações pendentes de publicação.' : 'Sem alterações pendentes.'}</p>
    <p>Publicar cria uma cópia do perfil, dos trabalhos e somente das apresentações públicas. Editar o rascunho não altera essa cópia.</p>
    <a href="/previa">Ver prévia</a>
    ${published ? `<a href="/${escapeHtml(state.slug)}">Abrir portfólio público</a>` : ''}
    <button type="button" data-publish>${published ? 'Republicar' : 'Publicar'}</button>
    ${published ? '<button type="button" data-unpublish>Retirar publicação</button>' : ''}`;
}
