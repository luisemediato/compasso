import { collectionDialog, field, newItemButton } from '../ui/forms.js';
import { pageHeading } from '../ui/components.js';
import { renderEvents } from '../ui/events.js';
import { renderCalendar } from '../ui/calendar.js';

export function renderAgenda(events, today) {
  const [year, month] = today.split('-').map(Number);
  const create = 'Nova apresentação';
  return pageHeading('Cada encontro importa', 'Agenda', newItemButton(create)) + `
    <div class="agenda-tools" data-agenda-filter>
      <fieldset class="period-tabs"><legend class="sr-only">Período das apresentações</legend>
        <label><input type="radio" name="period" value="all" checked>Todas</label>
        <label><input type="radio" name="period" value="upcoming">Próximas</label>
        <label><input type="radio" name="period" value="past">Anteriores</label>
      </fieldset>
      ${field('filter', 'Buscar apresentações', '', { type: 'search' })}
    </div>
    <div data-list>${renderEvents(events, true)}</div>
    ${collectionDialog(create, 'Editar apresentação', 'Salvar apresentação', `
      ${field('title', 'Título', '', { required: true })}
      ${field('date', 'Data', today, { type: 'date', required: true })}
      ${field('time', 'Horário', '', { type: 'time', required: true })}
      ${field('venue', 'Local', '', { required: true })}${field('city', 'Cidade')}${field('type', 'Tipo')}
      ${field('ticket', 'Link do ingresso (opcional)', '', { type: 'url' })}
      <label>Visibilidade<select name="visibility"><option value="private">Privada</option><option value="public">Pública</option></select></label>
      ${field('description', 'Descrição', '', { type: 'textarea' })}
      <details class="calendar-picker"><summary>Escolher data no calendário</summary>
        <div data-calendar>${renderCalendar(year, month - 1, today, { events })}</div>
      </details><p class="field-help">Apenas apresentações públicas entram no portfólio ao publicar.</p>`)}`;
}
