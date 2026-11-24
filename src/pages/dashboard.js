import { escapeHtml } from '../domain/formatting.js';
import { upcoming } from '../domain/collections.js';
import { renderEvents } from '../ui/events.js';

export function renderDashboard(state, today) {
  const checks = [state.profile.name, state.profile.instrument, state.profile.city, state.profile.bio, state.works.length];
  const progress = checks.filter(Boolean).length * 20;
  return `<h2>Painel de ${escapeHtml(state.profile.name)}</h2>
    <label>Progresso do portfólio: ${progress}% <progress max="100" value="${progress}">${progress}%</progress></label>
    <p>Complete nome, instrumento, cidade, trajetória e um trabalho.</p>
    <a href="/perfil">Editar perfil</a>
    <h3>Próximas apresentações</h3>${renderEvents(upcoming(state.events, today))}
    <button type="button" data-import>Importar rascunho deste navegador</button>`;
}
