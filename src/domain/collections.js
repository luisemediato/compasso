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
