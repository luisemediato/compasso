import { field, formActions } from '../ui/forms.js';
import { pageHeading } from '../ui/components.js';

export function renderProfile(profile) {
  return pageHeading('A sua história começa aqui', 'Meu perfil', '<a class="btn light" href="/previa">Visualizar portfólio</a>') + `
    <p class="note">Estes dados só mudam no portfólio público quando você publica novamente.</p>
    <form class="panel form-panel" method="post">
      <div class="form-grid">
        ${field('name', 'Nome artístico', profile.name, { required: true })}
        ${field('instrument', 'Instrumento', profile.instrument)}
        ${field('city', 'Cidade', profile.city)}
        ${field('email', 'E-mail público de contato (opcional)', profile.email, { type: 'email' })}
        ${field('headline', 'Frase de apresentação', profile.headline)}
        ${field('instagram', 'Instagram (usuário ou link)', profile.instagram)}
        ${field('bio', 'Sua trajetória', profile.bio, { type: 'textarea', max: 3000 })}
      </div>
      ${formActions('Salvar perfil')}
    </form>`;
}
