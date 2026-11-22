export function saveRecord(items, record) {
  const index = items.findIndex(item => item.id === record.id);
  const updated = [...items];
  if (index === -1) updated.push({ ...record });
  else updated[index] = { ...record };
  return updated;
}

export function deleteRecord(items, id) {
  return items.filter(item => item.id !== id);
}

export function sortedEvents(events) {
  return [...events].sort((a, b) =>
    (a.date ?? '').localeCompare(b.date ?? '') || (a.time ?? '').localeCompare(b.time ?? ''));
}

export function upcoming(events, today) {
  return sortedEvents(events.filter(event => event.date >= today));
}

export function filterEvents(events, query) {
  const term = String(query ?? '').trim().toLowerCase();
  return events.filter(event => [event.title, event.venue, event.city].join(' ').toLowerCase().includes(term));
}

export function calendarDays(year, month) {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 1);
  // A semana da agenda começa na segunda, mas getUTCDay() começa no domingo.
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return [
    ...Array(offset).fill(null),
    ...Array.from({ length: date.getUTCDate() }, (_, index) => index + 1),
  ];
}
