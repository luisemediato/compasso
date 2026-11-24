import { field, formActions } from '../ui/forms.js';
import { renderEvents } from '../ui/events.js';
import { renderCalendar } from '../ui/calendar.js';

export function renderAgenda(events, today) {
  const [year, month] = today.split('-').map(Number);
  return `<h2>Agenda</h2><div data-calendar>${renderCalendar(year, month - 1)}</div>
    <form method="post"><input type="hidden" name="id">
      ${field('title', 'Título', '', { required: true })}
      ${field('date', 'Data', today, { type: 'date', required: true })}
      ${field('time', 'Horário', '', { type: 'time', required: true })}
      ${field('venue', 'Local', '', { required: true })}${field('city', 'Cidade')}${field('type', 'Tipo')}
      ${field('ticket', 'Link do ingresso (opcional)', '', { type: 'url' })}
      ${field('description', 'Descrição', '', { type: 'textarea' })}
      <label>Visibilidade<select name="visibility"><option value="private">Privada</option><option value="public">Pública</option></select></label>
      <p>Apenas apresentações públicas entram no portfólio ao publicar.</p>
      ${formActions('Salvar apresentação')}<button type="button" data-cancel>Cancelar edição</button>
    </form>
    ${field('filter', 'Buscar apresentações')}
    <div data-list>${renderEvents(events, true)}</div>`;
}
