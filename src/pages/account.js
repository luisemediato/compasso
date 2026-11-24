function credentials(passwordAutocomplete) {
  return `
    <label>E-mail
      <input name="email" type="email" autocomplete="email" required>
    </label>
    <label>Senha
      <input name="password" type="password" autocomplete="${passwordAutocomplete}" required>
    </label>
  `;
}

export function renderLogin() {
  return `
    <h2>Entrar</h2>
    <form method="post">
      ${credentials('current-password')}
      <p data-error role="alert" tabindex="-1"></p>
      <button type="submit">Entrar</button>
      <a href="/cadastro">Criar conta</a>
    </form>
  `;
}

export function renderRegister() {
  return `
    <h2>Cadastrar</h2>
    <form method="post">
      <label>Nome completo
        <input name="fullName" autocomplete="name" required>
      </label>
      <label>Nome artístico
        <input name="artistName" required>
      </label>
      <label>Endereço do portfólio
        <input name="slug" autocapitalize="none" spellcheck="false" required>
      </label>
      ${credentials('new-password')}
      <p>Use uma senha de 8 a 128 caracteres com pelo menos um caractere especial.</p>
      <p data-error role="alert" tabindex="-1"></p>
      <button type="submit">Cadastrar</button>
    </form>
  `;
}
