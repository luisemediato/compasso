import { field, formActions } from '../ui/forms.js';
import { renderWorks } from '../ui/works.js';

export function renderWorksPage(works) {
  return `<h2>Trabalhos</h2><form method="post">
    <input type="hidden" name="id">
    ${field('title', 'Título', '', { required: true })}
    ${field('url', 'Link do trabalho', '', { type: 'url', required: true })}
    ${field('type', 'Tipo')}${field('description', 'Descrição', '', { type: 'textarea' })}
    ${formActions('Salvar trabalho')}<button type="button" data-cancel>Cancelar edição</button>
    </form><div data-list>${renderWorks(works, true)}</div>`;
}
