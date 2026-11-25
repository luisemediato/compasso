import { escapeHtml } from '../domain/formatting.js';
import { hasUnpublishedChanges } from '../domain/publication.js';
import { icon, pageHeading } from '../ui/components.js';

import { formActions } from '../ui/forms.js';

function publicationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const formatted = date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
  return `<p>Última publicação em <time datetime="${escapeHtml(value)}">${formatted}</time>.</p>`;
}

export function renderPublication(state, origin = '') {
  const published = Boolean(state.publication);
  return pageHeading('Pronto para ser visto', 'Seu portfólio, no seu tempo', '<a class="btn light" href="/previa">Ver prévia</a>') + `
    <p class="note">Seu endereço reservado é <strong>/${escapeHtml(state.slug)}</strong>. O portfólio fica visível após a publicação.</p>
    <section class="panel publication-panel" aria-labelledby="situacao-publicacao">
      <span class="publication-symbol">${icon('music')}</span>
      <p class="eyebrow">Publicação</p><h2 id="situacao-publicacao">${published ? 'Portfólio publicado.' : 'Portfólio ainda não publicado.'}</h2>
      <p>${hasUnpublishedChanges(state, state.publication) ? 'Alterações pendentes de publicação.' : 'Sem alterações pendentes.'}</p>
      ${publicationTime(state.publication?.publishedAt)}
      <p>Publicar cria uma cópia do perfil, dos trabalhos e somente das apresentações públicas. Editar o rascunho não altera essa cópia.</p>
      <div class="actions">
        <button class="btn" type="button" data-publish aria-haspopup="dialog" aria-controls="confirmar-publicacao">${published ? 'Republicar' : 'Publicar'}</button>
        ${published ? `<a class="btn light" href="/${escapeHtml(state.slug)}">Abrir portfólio público</a>
          <button type="button" data-unpublish>Retirar publicação</button>` : ''}
      </div>
    </section>
    <dialog id="confirmar-publicacao" aria-labelledby="titulo-confirmacao">
      <h2 id="titulo-confirmacao">${published ? 'Republicar as alterações?' : 'Publicar seu portfólio?'}</h2>
      <p>Seu público poderá ver esta versão em <strong>${escapeHtml(origin + '/' + state.slug)}</strong>.</p>
      <form method="post"><div class="actions">
        <button type="button" data-cancel autofocus>Cancelar</button>${formActions('Confirmar publicação')}
      </div></form>
    </dialog>`;
}
