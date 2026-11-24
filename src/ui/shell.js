export function renderShell() {
  return `
    <header>
      <h1>Compasso</h1>
      <nav aria-label="Navegação principal">
        <a href="/">Início</a>
      </nav>
    </header>
    <div data-notice role="status"></div>
    <nav data-private aria-label="Área do músico" hidden>
      <a href="/painel">Painel</a>
      <a href="/perfil">Perfil</a>
      <a href="/trabalhos">Trabalhos</a>
      <a href="/agenda">Agenda</a>
      <a href="/previa">Prévia</a>
      <a href="/publicacao">Publicação</a>
      <button type="button" data-logout>Sair</button>
    </nav>
    <main id="conteudo" tabindex="-1"></main>
    <footer>Compasso · <a href="/contato">Fale com a equipe</a></footer>
  `;
}
