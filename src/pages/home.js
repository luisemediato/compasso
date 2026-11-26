import { icon } from '../ui/components.js';

export function renderHome(signedIn = false) {
  return `
    <section class="landing-hero" aria-labelledby="titulo-inicio">
      <div>
        <p class="eyebrow">Um espaço para sua música</p>
        <h1 id="titulo-inicio">Seu talento merece<br> um lugar no mundo.</h1>
        <p class="intro">Seu portfólio, seus próximos palcos e novas conexões.<br>Tudo em um só compasso.</p>
        <div class="actions">
          <a class="btn" data-home-account href="${signedIn ? '/painel' : '/cadastro'}">Organizar meu espaço ${icon('arrow')}</a>
          <a class="btn light" href="/explorar">Descobrir músicos ${icon('music')}</a>
        </div>
      </div>
      <figure class="landing-photo">
        <img src="/performance.jpg" alt="Instrumentista de cordas durante uma apresentação">
        <figcaption><small>A sua música, mais perto</small>De quem quer ouvir.</figcaption>
      </figure>
    </section>
    <div class="landing-features">
      <section><h2>Conte sua história</h2><p>Reúna sua trajetória e seus trabalhos em um portfólio com a sua cara.</p></section>
      <section><h2>Marque o próximo encontro</h2><p>Organize apresentações e ajude seu público a acompanhar sua agenda.</p></section>
      <section><h2>Publique no seu tempo</h2><p>Edite com calma, confira a prévia e só então atualize sua versão publicada.</p></section>
    </div>
    <section class="public-section" aria-labelledby="titulo-vitrine">
      <div class="section-heading">
        <div><p class="eyebrow">Música cria conexões</p><h2 id="titulo-vitrine">Conheça novos sons</h2></div>
        <a class="btn light" href="/explorar">Explorar músicos ${icon('arrow')}</a>
      </div>
      <div data-featured aria-live="polite">Carregando músicos…</div>
    </section>`;
}
