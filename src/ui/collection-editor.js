import { deleteRecord, saveRecord } from '../domain/collections.js';

export function bindCollection({ main, window, getItems, collection, validate, bindForm, save, refresh, run }) {
  const dialog = main.querySelector('dialog');
  const form = dialog.querySelector('form');
  const add = main.querySelector('[data-new]');
  let opener;
  let refreshOnClose = false;

  function openEditor(trigger, record) {
    opener = trigger;
    form.reset();
    form.elements.namedItem('id').value = '';
    form.querySelector('[data-error]').textContent = '';
    for (const field of form.querySelectorAll('[aria-invalid], [aria-describedby="form-feedback"]')) {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }
    const type = form.elements.namedItem('type');
    type.querySelector('[data-saved-type]')?.remove();
    if (record) {
      const savedType = record.type ?? '';
      if (![...type.options].some(option => option.value === savedType)) {
        const option = new window.Option(savedType || 'Sem classificação', savedType);
        option.dataset.savedType = '';
        type.add(option);
      }
      type.value = savedType;
    }
    for (const [name, value] of Object.entries(record ?? {})) {
      const field = form.elements.namedItem(name);
      if (field) field.value = value;
    }
    form.elements.namedItem('date')?.dispatchEvent(new window.Event('change'));
    dialog.querySelector('h2').textContent = record ? dialog.dataset.editTitle : dialog.dataset.createTitle;
    dialog.showModal();
    form.elements.namedItem('title').focus();
  }

  add.addEventListener('click', () => openEditor(add));
  main.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', event => {
    if (form.querySelector('[type="submit"]').disabled) event.preventDefault();
  });
  dialog.addEventListener('close', () => {
    if (dialog.open || !main.contains(form)) return;
    if (refreshOnClose) {
      run(async () => {
        await refresh();
        main.querySelector('[data-new]')?.focus();
      });
    } else opener?.focus();
  });
  main.querySelector('[data-list]').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit]');
    const remove = event.target.closest('[data-delete]');
    if (edit) {
      const record = getItems().find(item => item.id === edit.dataset.edit);
      if (record) openEditor(edit, record);
    }
    if (remove && !remove.disabled && window.confirm('Excluir este registro?')) {
      const editButton = remove.parentElement.querySelector('[data-edit]');
      remove.disabled = editButton.disabled = true;
      run(async () => {
        try {
          await save({ [collection]: deleteRecord(getItems(), remove.dataset.delete) });
          if (!main.contains(form)) return;
          if (dialog.open) refreshOnClose = true;
          else await refresh();
        } finally {
          remove.disabled = editButton.disabled = false;
        }
      });
    }
  });
  bindForm(async (data, current) => {
    const record = { ...data, id: data.id || window.crypto.randomUUID() };
    const error = validate(record);
    if (error) throw new Error(error);
    await save({ [collection]: saveRecord(getItems(), record) });
    if (current()) {
      await refresh();
      main.querySelector('[data-new]')?.focus();
    }
  });
}
