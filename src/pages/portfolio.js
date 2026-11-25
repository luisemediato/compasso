import { escapeHtml as e, localDate } from '../domain/formatting.js';
import { normalizeInstagram } from '../domain/validation.js';
import { renderWorks } from '../ui/works.js';
import { renderEvents } from '../ui/events.js';

export function renderPortfolio(draft, preview = false, embedded = false, today = localDate()) {
  const { profile, works, events } = draft;
  const instagram = normalizeInstagram(profile.instagram);
  const titleTag = embedded ? 'h2' : 'h1';
  return `<article class="portfolio">
    ${preview ? `<aside class="preview-bar">
      <p><strong>Prévia privada</strong> · apenas as apresentações públicas aparecem aqui.</p>
      <div class="actions"><a href="/perfil">Voltar a editar</a><a class="btn peach" href="/publicacao">Revisar publicação</a></div>
    </aside>` : ''}
    <section id="portfolio-sobre" class="portfolio-hero" aria-labelledby="nome-artista">
      <div>
        <p class="eyebrow">${[profile.instrument, profile.city].filter(Boolean).map(e).join(' · ')}</p>
        <${titleTag} id="nome-artista">${e(profile.name)}</${titleTag}>
        <p class="headline">${e(profile.headline?.trim() || 'A música é o meu ponto de encontro.')}</p><p class="intro preserve-lines">${e(profile.bio)}</p>
        <a class="btn" href="#portfolio-agenda">Ver agenda</a>
      </div>
      <div class="portrait"><img src="/performance.jpg" alt="Imagem ilustrativa de uma apresentação de cordas"></div>
    </section>
    <section id="portfolio-trabalhos" class="public-section" aria-labelledby="titulo-trabalhos">
      <p class="eyebrow">Em cena</p><h2 id="titulo-trabalhos">Um pouco da minha música</h2>${renderWorks(works)}
    </section>
    <section id="portfolio-agenda" class="public-section" aria-labelledby="titulo-agenda">
      <p class="eyebrow">Vamos nos encontrar</p><h2 id="titulo-agenda">Próximos palcos</h2>${renderEvents(events, false, { publicFrom: today })}
    </section>
    <section id="portfolio-contato" class="public-section" aria-labelledby="titulo-contato-artista">
      <div class="contact-card">
        <div><p class="eyebrow">Música cria conexões</p><h2 id="titulo-contato-artista">Vamos conversar?</h2>
          <p>Apresentações, projetos e boas ideias começam com um encontro.</p></div>
        <div class="actions">
          ${profile.email ? `<a class="btn peach" href="mailto:${e(profile.email)}">Entrar em contato</a>` : ''}
          ${instagram ? `<a href="${e(instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a>` : ''}
          ${!profile.email && !instagram ? '<p>Contato em breve.</p>' : ''}
        </div>
      </div>
    </section></article>`;
}
