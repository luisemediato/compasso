import { categorySelect, collectionDialog, field, newItemButton } from '../ui/forms.js';
import { pageHeading } from '../ui/components.js';
import { renderWorks } from '../ui/works.js';

export function renderWorksPage(works) {
  const create = 'Adicionar trabalho';
  return pageHeading('Deixe a música falar', 'Meus trabalhos', newItemButton(create)) + `
    <div data-list>${renderWorks(works, true)}</div>
    ${collectionDialog(create, 'Editar trabalho', 'Salvar trabalho', `
      ${field('title', 'Título', '', { required: true })}
      ${field('url', 'Link do trabalho', '', { type: 'url', required: true })}
      ${categorySelect('Categoria', ['Interpretação', 'Música de câmara', 'Projeto', 'Outro'])}${field('description', 'Descrição', '', { type: 'textarea' })}`)}`;
}
