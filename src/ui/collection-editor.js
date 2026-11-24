import { deleteRecord, saveRecord } from '../domain/collections.js';

export function bindCollection({ main, window, items, collection, validate, bindForm, save, refresh, run }) {
  const form = main.querySelector('form');
  const page = form.parentElement;
  main.querySelector('[data-cancel]').addEventListener('click', () => {
    form.reset();
    form.querySelector('[data-error]').textContent = '';
    form.elements.namedItem('title').focus();
  });
  main.querySelector('[data-list]').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit]');
    const remove = event.target.closest('[data-delete]');
    if (edit) {
      const record = items.find(item => item.id === edit.dataset.edit);
      form.reset();
      for (const [name, value] of Object.entries(record)) {
        const field = form.elements.namedItem(name);
        if (field) field.value = value;
      }
      form.elements.namedItem('title').focus();
    }
    if (remove && !remove.disabled && window.confirm('Excluir este registro?')) {
      remove.disabled = true;
      run(async () => {
        try {
          await save({ [collection]: deleteRecord(items, remove.dataset.delete) });
          if (page.contains(form)) await refresh();
        }
        finally { remove.disabled = false; }
      });
    }
  });
  bindForm(async (data, current) => {
    const record = { ...data, id: data.id || window.crypto.randomUUID() };
    const error = validate(record);
    if (error) throw new Error(error);
    await save({ [collection]: saveRecord(items, record) });
    if (current()) await refresh();
  });
}
