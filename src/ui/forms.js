import { icon } from './components.js';
import { suggestSlug } from '../domain/account.js';
import { escapeHtml } from '../domain/formatting.js';

export function field(name, label, value = '', { type = 'text', required = false, max = 4000 } = {}) {
  const attrs = `name="${name}" ${required ? 'required' : ''} maxlength="${max}"`;
  const input = type === 'textarea'
    ? `<textarea ${attrs}>${escapeHtml(value)}</textarea>`
    : `<input ${attrs} type="${type}" value="${escapeHtml(value)}">`;
  return `<label>${label}${input}</label>`;
}

export function categorySelect(label, choices) {
  const options = choices.map(choice => `<option>${escapeHtml(choice)}</option>`).join('');
  return `<label>${escapeHtml(label)}<select name="type">${options}</select></label>`;
}

export function formActions(label = 'Salvar') {
  return `<p data-error role="alert" tabindex="-1"></p><button type="submit">${label}</button>`;
}

export function bindSlugSuggestion(form) {
  const artist = form.elements.namedItem('artistName');
  const slug = form.elements.namedItem('slug');
  const preview = form.querySelector('#previa-endereco');
  let edited = Boolean(slug.value);

  function updatePreview() {
    preview.textContent = slug.value ? form.ownerDocument.location.origin + '/' + slug.value : '';
  }
  slug.addEventListener('input', () => {
    edited = Boolean(slug.value);
    updatePreview();
  });
  artist.addEventListener('input', () => {
    if (!edited) slug.value = suggestSlug(artist.value);
    updatePreview();
  });
  updatePreview();
}

export function newItemButton(label) {
  return `<button type="button" class="btn" data-new aria-haspopup="dialog" aria-controls="editor">${icon('plus')}${label}</button>`;
}

export function collectionDialog(createLabel, editLabel, saveLabel, fields) {
  return `<dialog id="editor" aria-labelledby="editor-title" data-create-title="${createLabel}" data-edit-title="${editLabel}">
    <h2 id="editor-title">${createLabel}</h2>
    <form method="post">
      <input type="hidden" name="id">
      <div class="form-grid">${fields}</div>
      <div class="actions">${formActions(saveLabel)}<button type="button" data-cancel>Cancelar edição</button></div>
    </form></dialog>`;
}
