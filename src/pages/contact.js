import { field, formActions } from '../ui/forms.js';

export function renderContact() {
  return `<section class="panel account-panel contact-layout">
    <h1>Fale com a equipe</h1><p class="intro">Envie uma dúvida ou conte o que aconteceu ao usar o Compasso.</p>
    <form method="post">
      ${field('email', 'E-mail', '', { type: 'email', required: true, max: 254 })}
      ${field('message', 'Mensagem', '', { type: 'textarea', required: true, max: 2000 })}
      ${formActions('Enviar mensagem')}
    </form></section>`;
}
