import { field, formActions } from '../ui/forms.js';

export function renderProfile(profile) {
  return `<h2>Perfil</h2><p>Estes dados só mudam no portfólio público quando você publica novamente.</p>
    <form method="post">
      ${field('name', 'Nome artístico', profile.name, { required: true })}
      ${field('instrument', 'Instrumento', profile.instrument)}
      ${field('city', 'Cidade', profile.city)}
      ${field('headline', 'Frase de apresentação', profile.headline)}
      ${field('bio', 'Trajetória', profile.bio, { type: 'textarea', max: 3000 })}
      ${field('email', 'E-mail público (opcional)', profile.email, { type: 'email' })}
      ${field('instagram', 'Instagram (usuário ou link)', profile.instagram)}
      ${formActions('Salvar perfil')}
    </form>`;
}
