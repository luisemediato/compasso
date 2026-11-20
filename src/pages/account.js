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
      <button type="submit" disabled>Entrar</button>
      <p>O acesso estará disponível quando a autenticação estiver integrada.</p>
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
      <button type="submit" disabled>Cadastrar</button>
      <p>O envio estará disponível quando o cadastro estiver integrado.</p>
    </form>
  `;
}
