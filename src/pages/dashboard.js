import { upcoming } from '../domain/collections.js';
import { renderEvents } from '../ui/events.js';
import { renderCalendar } from '../ui/calendar.js';
import { icon, pageHeading } from '../ui/components.js';

export function renderDashboard(state, today) {
  const checks = [state.profile.name, state.profile.instrument, state.profile.city, state.profile.bio, state.works.length];
  const progress = checks.filter(Boolean).length * 20;
  const next = upcoming(state.events, today);
  const [year, month] = today.split('-').map(Number);
  const stats = [
    ['Próximas apresentações', String(next.length).padStart(2, '0'), 'calendar'],
    ['Trabalhos no portfólio', String(state.works.length).padStart(2, '0'), 'music'],
    ['Seu perfil', progress + '%', 'user'],
  ];
  const action = `<a class="btn" href="/agenda?novo=1">Nova apresentação ${icon('calendar')}</a>`;
  return pageHeading('Seu espaço criativo', 'Painel de ' + state.profile.name, action) + `
    <section class="dashboard-hero">
      <div><p class="eyebrow">Seu talento, em um só lugar</p><h2>O palco é seu.<br>A gente organiza o resto.</h2>
      <p>Compartilhe sua trajetória, seus trabalhos e os próximos encontros com a sua música.</p>
      <a class="btn peach" href="/previa">Ver meu portfólio ${icon('external')}</a></div>
    </section>
    <dl class="stats">${stats.map(([label, value, symbol]) => `<div>
      <dt>${label}<span class="stat-icon" aria-hidden="true">${icon(symbol)}</span></dt><dd>${value}</dd>
    </div>`).join('')}</dl>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><h2>Seus próximos palcos</h2><a href="/agenda">Ver agenda</a></div>
        ${renderEvents(next.slice(0, 3))}</section>
      <section class="panel"><div class="panel-head"><h2>Sua agenda, em um olhar</h2>${icon('calendar')}</div>
        <div data-calendar>${renderCalendar(year, month - 1, today, { events: state.events, selectable: false })}</div>
      </section>
      <section class="panel dashboard-progress">
        <div class="panel-head"><h2>Um portfólio com a sua cara</h2><a href="/perfil">Editar perfil</a></div>
        <label>Progresso do portfólio: ${progress}% <progress max="100" value="${progress}">${progress}%</progress></label>
        <p>Complete nome, instrumento, cidade, trajetória e um trabalho.</p>
        <button type="button" data-import>Importar rascunho deste navegador</button>
      </section>
      <section class="panel quick-card">
        ${icon('music')}<h2>Dê play no seu trabalho</h2><p>Adicione uma interpretação ao seu portfólio.</p>
        <a href="/trabalhos?novo=1">Adicionar trabalho ${icon('arrow')}</a>
      </section>
    </div>`;
}
