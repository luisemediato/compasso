import { calendarDays } from '../domain/collections.js';

const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function renderCalendar(year, month, selected = '', { events = [], selectable = true } = {}) {
  const prefix = `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}`;
  const dates = new Set(events.map(event => event.date));
  const first = new Date(0);
  first.setUTCFullYear(year, month, 1);
  const monthName = monthFormat.format(first);
  return `<div class="calendar">
    <div class="calendar-head"><h3>${monthName}</h3><div>
      <button type="button" data-month="-1" aria-label="Mês anterior">‹</button>
      <button type="button" data-month="1" aria-label="Próximo mês">›</button>
    </div></div>
    <div class="calendar-days" aria-label="Dias do mês">
      ${['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => `<span class="weekday">${day}</span>`).join('')}
      ${calendarDays(year, month).map(day => {
        if (day === null) return '<span></span>';
        const date = `${prefix}-${String(day).padStart(2, '0')}`;
        const hasEvent = dates.has(date);
        const mark = hasEvent ? ' class="has-event"' : '';
        const label = date + (hasEvent ? ', com apresentação' : '');
        return selectable
          ? `<button type="button" data-day="${date}" aria-label="Selecionar ${label}" aria-pressed="${date === selected}"${mark}>${day}</button>`
          : `<time datetime="${date}" ${date === selected ? 'aria-current="date"' : ''}${mark}>${day}${hasEvent ? '<span class="sr-only">, com apresentação</span>' : ''}</time>`;
      }).join('')}
    </div></div>`;
}

export function bindCalendar(container, today, events, dateInput) {
  let [year, month] = today.split('-').map(Number);
  month--;
  function draw() {
    container.innerHTML = renderCalendar(year, month, dateInput?.value ?? today, { events, selectable: Boolean(dateInput) });
  }
  dateInput?.addEventListener('change', () => {
    if (!dateInput.value) return;
    [year, month] = dateInput.value.split('-').map(Number);
    month--;
    draw();
  });
  container.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const { day, month: step } = button.dataset;
    if (step) {
      month += Number(step);
      year += Math.floor(month / 12);
      month = (month + 12) % 12;
    } else if (dateInput && day) {
      dateInput.value = day;
    }
    draw();
    container.querySelector(step ? `[data-month="${step}"]` : `[data-day="${day}"]`)?.focus();
  });
}
