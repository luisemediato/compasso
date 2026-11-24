import { field, formActions } from '../ui/forms.js';

export function renderContact() {
  return `<h2>Fale com a equipe</h2><form method="post">
    ${field('email', 'E-mail', '', { type: 'email', required: true, max: 254 })}
    ${field('message', 'Mensagem', '', { type: 'textarea', required: true, max: 2000 })}
    ${formActions('Enviar mensagem')}
  </form>`;
}
