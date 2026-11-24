import { calendarDays } from '../domain/collections.js';

export function renderCalendar(year, month, selected = '') {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return `<div class="calendar"><h3>${prefix}</h3>
    <button type="button" data-month="-1">Mês anterior</button>
    <button type="button" data-month="1">Próximo mês</button>
    <div class="calendar-days" aria-label="Dias do mês">
      ${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => `<span>${d}</span>`).join('')}
      ${calendarDays(year, month).map(day => {
        const date = `${prefix}-${String(day).padStart(2, '0')}`;
        return day === null ? '<span></span>' : `<button type="button" data-day="${date}" aria-label="Selecionar ${date}" aria-pressed="${date === selected}">${day}</button>`;
      }).join('')}
    </div></div>`;
}
