export function renderShell() {
  return `
    <header class="public-header">
      <a class="brand" href="/" aria-label="Compasso início">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>compasso<small>Espaço para sua música</small></span>
      </a>
      <nav class="public-links site-links" aria-label="Navegação principal">
        <a href="/">Início</a><a href="/explorar">Explorar músicos</a><a href="/contato">Contato</a>
      </nav>
      <nav class="public-links portfolio-links" aria-label="Seções do portfólio">
        <a href="#portfolio-sobre">Sobre</a><a href="#portfolio-trabalhos">Trabalhos</a>
        <a href="#portfolio-agenda">Agenda</a><a href="#portfolio-contato">Contato</a>
      </nav>
      <div class="account-links" data-guest><a href="/entrar">Entrar</a><a class="btn" href="/cadastro">Criar conta</a></div>
      <a class="btn light" data-member href="/painel" hidden>Meu espaço criativo</a>
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
    <footer class="public-footer"><span>compasso · Um espaço para a sua música.</span><a href="/contato">Fale com a equipe</a></footer>
  `;
}
