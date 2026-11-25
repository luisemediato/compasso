import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { newDraft } from '../../src/domain/account.js';
import { renderProfile } from '../../src/pages/profile.js';
import { renderDashboard } from '../../src/pages/dashboard.js';
import { renderPortfolio } from '../../src/pages/portfolio.js';
import { renderPublication } from '../../src/pages/publication.js';
import { renderArtistList, renderExplore } from '../../src/pages/explore.js';
import { renderAgenda } from '../../src/pages/agenda.js';
import { renderWorksPage } from '../../src/pages/works.js';
import { renderWorks } from '../../src/ui/works.js';
import { renderEvents } from '../../src/ui/events.js';
import { renderCalendar } from '../../src/ui/calendar.js';

const fragment = html => JSDOM.fragment(html);
const concert = { id: 'e1', title: 'Recital', date: '2030-06-15', time: '19:00', venue: 'Sala', visibility: 'public' };

test('perfil usa rótulos, contato opcional e Instagram como texto', () => {
  const doc = fragment(renderProfile(newDraft('Davi').profile));
  const instagram = doc.querySelector('[name="instagram"]');
  assert.equal(instagram.type, 'text');
  assert.equal(instagram.labels[0].textContent, 'Instagram (usuário ou link)');
  assert.equal(doc.querySelector('[name="email"]').required, false);
  assert.equal(doc.querySelector('[name="name"]').value, 'Davi');
});

test('painel vazio orienta músico e não inclui apresentações antigas nas próximas', () => {
  const state = newDraft('Davi');
  state.events = [{ ...concert, date: '2020-01-01' }];
  const doc = fragment(renderDashboard(state, '2026-11-24'));
  assert.equal(doc.querySelector('progress').value, 20);
  assert.match(doc.textContent, /Nenhuma apresentação/);
});

test('painel aumenta progresso conforme perfil e trabalhos são preenchidos', () => {
  const state = newDraft('Davi');
  Object.assign(state.profile, { city: 'BH', bio: 'Músico', instrument: 'Viola' });
  state.works = [{ id: 'w1' }];
  state.events = [concert];
  const doc = fragment(renderDashboard(state, '2030-01-01'));
  assert.equal(doc.querySelector('progress').value, 100);
  const stats = [...doc.querySelectorAll('.stats dt')].map(term => [term.textContent, term.nextElementSibling.textContent]);
  assert.deepEqual(stats, [['Próximas apresentações', '01'], ['Trabalhos no portfólio', '01'], ['Seu perfil', '100%']]);
  assert.ok(doc.querySelector('a[href="/previa"]'));
  assert.match(doc.textContent, /Recital/);
});

test('prévia omite contatos vazios, identidade privada e eventos sem opção pública', () => {
  const draft = newDraft('Nome artístico');
  draft.fullName = 'Nome civil secreto';
  draft.email = 'login@example.com';
  draft.events = [concert, { ...concert, id: 'e2', title: 'Ensaio privado', visibility: 'private' }, { ...concert, id: 'e3', title: 'Evento legado', visibility: undefined }];
  const doc = fragment(renderPortfolio(draft, true));
  assert.match(doc.textContent, /Prévia privada/);
  assert.equal(doc.querySelector('a[href="/publicacao"]')?.textContent, 'Revisar publicação');
  assert.equal(doc.querySelector('#portfolio-sobre h1')?.textContent, 'Nome artístico');
  assert.match(doc.textContent, /Recital/);
  assert.doesNotMatch(doc.textContent, /Ensaio privado|Evento legado|Nome civil secreto|login@example.com/);
  assert.equal(doc.querySelector('a[href^="mailto:"]'), null);
});

test('portfólio mostra Instagram normalizado, contato escolhido e trabalhos', () => {
  const draft = newDraft('Davi');
  Object.assign(draft.profile, { instagram: '@davi', email: 'publico@example.com' });
  draft.works = [{ id: 'w1', title: 'Gravação', url: 'https://example.com', description: 'Ao vivo' }];
  const doc = fragment(renderPortfolio(draft));
  for (const id of ['portfolio-sobre', 'portfolio-trabalhos', 'portfolio-agenda', 'portfolio-contato']) {
    assert.ok(doc.getElementById(id), id);
  }
  assert.equal(doc.querySelector('a[href*="instagram"]').getAttribute('href'), 'https://www.instagram.com/davi/');
  assert.equal(doc.querySelector('a[href^="mailto:"]').getAttribute('href'), 'mailto:publico@example.com');
  assert.match(doc.textContent, /Gravação/);
});

test('conteúdo do músico é escapado e links perigosos não viram âncoras', () => {
  const works = fragment(renderWorks([{ title: '<script>roubar()</script>', url: 'javascript:alert(1)' }]));
  assert.equal(works.querySelector('script, a'), null);
  assert.match(works.textContent, /<script>/);
  const events = fragment(renderEvents([{ ...concert, ticket: 'javascript:alert(1)', description: '<img src=x>' }]));
  assert.equal(events.querySelector('img, a'), null);
});

test('agenda oferece visibilidade privada como padrão e campos opcionais', () => {
  const doc = fragment(renderAgenda([], '2026-11-24'));
  assert.equal(doc.querySelector('[name="visibility"]').value, 'private');
  assert.equal(doc.querySelector('[name="date"]').value, '2026-11-24');
  assert.equal(doc.querySelector('[name="ticket"]').required, false);
});

test('eventos antigos sem visibilidade são apresentados como privados na edição', () => {
  const doc = fragment(renderEvents([{ ...concert, visibility: undefined, ticket: 'https://example.com', city: 'BH', type: 'Recital' }], true));
  assert.match(doc.textContent, /Privada/);
  assert.equal(doc.querySelector('[data-edit]').dataset.edit, 'e1');
  assert.equal(doc.querySelector('a').getAttribute('href'), 'https://example.com/');
});

test('calendário expõe seleção e inclui o dia bissexto', () => {
  const doc = fragment(renderCalendar(2028, 1, '2028-02-29'));
  assert.equal(doc.querySelectorAll('[data-day]').length, 29);
  assert.equal(doc.querySelector('[aria-pressed="true"]').dataset.day, '2028-02-29');
});

test('trabalhos vazios apresentam formulário e mensagem', () => {
  const doc = fragment(renderWorksPage([]));
  assert.match(doc.textContent, /Nenhum trabalho/);
  assert.equal(doc.querySelector('[name="url"]').type, 'url');
});

test('publicação inicial não oferece retirada nem endereço público', () => {
  const doc = fragment(renderPublication({ ...newDraft('Davi'), slug: 'davi', publication: null }));
  assert.equal(doc.querySelector('[data-unpublish]'), null);
  assert.equal(doc.querySelector('a[href="/davi"]'), null);
  assert.equal(doc.querySelector('[data-publish]').textContent, 'Publicar');
});

test('explorar mantém demonstração identificada e diferencia lista vazia', () => {
  assert.match(fragment(renderExplore()).textContent, /Catálogo de demonstração/);
  assert.match(fragment(renderArtistList([])).textContent, /Nenhum músico/);
  const doc = fragment(renderArtistList([{ slug: 'davi', profile: { name: 'Davi', instrument: 'Viola', city: 'BH' } }]));
  assert.equal(doc.querySelector('a').getAttribute('href'), '/davi');
  assert.match(doc.textContent, /Viola · BH/);
});
