function accountPage(register) {
  return `<div class="account-layout">
    <div class="account-photo"><img src="/performance.jpg" alt=""></div>
    <section class="panel account-panel" aria-labelledby="titulo-conta">
      <h1 id="titulo-conta">${register ? 'Crie sua conta de músico' : 'Entre no seu espaço'}</h1>
      <form method="post">
        ${register ? `
          <label>Nome completo<input name="fullName" autocomplete="name" required></label>
          <label>Nome artístico<input name="artistName" autocomplete="nickname" required></label>
          <label>Endereço do portfólio<input name="slug" autocapitalize="none" spellcheck="false" aria-describedby="ajuda-endereco" required></label>
          <p id="ajuda-endereco" class="field-help">O endereço é sugerido a partir do seu nome artístico. Você pode editá-lo.</p>` : ''}
        <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
        <label>Senha<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" ${register ? 'aria-describedby="ajuda-senha"' : ''} required></label>
        ${register ? '<p id="ajuda-senha" class="field-help">Use uma senha de 8 a 128 caracteres com pelo menos um caractere especial.</p>' : ''}
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
