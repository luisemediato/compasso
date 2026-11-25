import { escapeHtml } from '../domain/formatting.js';
import { hasUnpublishedChanges } from '../domain/publication.js';
import { icon, pageHeading } from '../ui/components.js';

export function renderPublication(state) {
  const published = Boolean(state.publication);
  return pageHeading('Pronto para ser visto', 'Seu portfólio, no seu tempo', '<a class="btn light" href="/previa">Ver prévia</a>') + `
    <p class="note">Seu endereço reservado é <strong>/${escapeHtml(state.slug)}</strong>. O portfólio fica visível após a publicação.</p>
    <section class="panel publication-panel" aria-labelledby="situacao-publicacao">
      <span class="publication-symbol">${icon('music')}</span>
      <p class="eyebrow">Publicação</p><h2 id="situacao-publicacao">${published ? 'Portfólio publicado.' : 'Portfólio ainda não publicado.'}</h2>
      <p>${hasUnpublishedChanges(state, state.publication) ? 'Alterações pendentes de publicação.' : 'Sem alterações pendentes.'}</p>
      <p>Publicar cria uma cópia do perfil, dos trabalhos e somente das apresentações públicas. Editar o rascunho não altera essa cópia.</p>
      <div class="actions">
        <button class="btn" type="button" data-publish>${published ? 'Republicar' : 'Publicar'}</button>
        ${published ? `<a class="btn light" href="/${escapeHtml(state.slug)}">Abrir portfólio público</a>
          <button type="button" data-unpublish>Retirar publicação</button>` : ''}
      </div>
    </section>`;
}
