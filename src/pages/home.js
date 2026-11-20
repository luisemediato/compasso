export function renderHome() {
  return `
    <section aria-labelledby="titulo-descoberta">
      <h2 id="titulo-descoberta">Descubra artistas</h2>
      <img class="home-performance" src="/performance.jpg" alt="">
      <p>Conheça os trabalhos dos músicos e confira suas próximas apresentações.</p>
      <a href="/explorar">Explorar</a>
    </section>

    <section aria-labelledby="titulo-musico">
      <h2 id="titulo-musico">Área do músico</h2>
      <p>Entre na sua conta ou cadastre-se para criar seu portfólio.</p>
      <a href="/entrar">Entrar</a>
      <a href="/cadastrar">Cadastrar</a>
    </section>
  `;
}
