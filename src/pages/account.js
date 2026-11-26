import { MAX_PASSWORD_LENGTH, MAX_SLUG_LENGTH, MIN_PASSWORD_LENGTH } from '../domain/account.js';

function accountPage(register) {
  return `<div class="account-layout">
    <div class="account-photo"><img src="/performance.jpg" alt=""></div>
    <section class="panel account-panel" aria-labelledby="titulo-conta">
      <h1 id="titulo-conta">${register ? 'Crie sua conta de músico' : 'Entre no seu espaço'}</h1>
      <form method="post">
        ${register ? `
          <label>Nome completo<input name="fullName" maxlength="120" autocomplete="name" required></label>
          <label>Nome artístico<input name="artistName" maxlength="120" autocomplete="nickname" required></label>
          <label>Endereço do portfólio<input name="slug" maxlength="${MAX_SLUG_LENGTH}" autocapitalize="none" spellcheck="false" aria-describedby="ajuda-endereco previa-endereco" required></label>
          <p id="ajuda-endereco" class="field-help">O endereço é sugerido a partir do seu nome artístico. Você pode editá-lo.</p>
          <p id="previa-endereco" class="field-help" aria-live="polite"></p>` : ''}
        <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
        <label>Senha<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" ${register ? `minlength="${MIN_PASSWORD_LENGTH}" maxlength="${MAX_PASSWORD_LENGTH}" aria-describedby="ajuda-senha"` : ''} required></label>
        ${register ? `<ul id="ajuda-senha" class="field-help">
          <li>Use de ${MIN_PASSWORD_LENGTH} a ${MAX_PASSWORD_LENGTH} caracteres.</li>
          <li>Inclua pelo menos um sinal de pontuação ou símbolo, como !, @ ou #.</li>
        </ul>` : ''}
        <p data-error role="alert" tabindex="-1"></p>
        <button type="submit">${register ? 'Cadastrar' : 'Entrar'}</button>
      </form>
      <p>${register ? 'Já tem conta? <a href="/entrar">Entrar</a>' : 'Primeira vez por aqui? <a href="/cadastro">Criar conta</a>'}</p>
    </section></div>`;
}

export function renderLogin() {
  return accountPage(false);
}

export function renderRegister() {
  return accountPage(true);
}
