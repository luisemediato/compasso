import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { startApp } from '../../src/app.js';
import { newDraft } from '../../src/domain/account.js';
import { searchArtists } from '../../src/domain/publication.js';

function account(name = 'Davi', id = 'a') {
  return { id, slug: id + '-musico', revision: 0, ...newDraft(name), publication: null };
}

function open(t, path, api, initial) {
  const dom = new JSDOM('<div id="app"></div>', { url: 'https://compasso.test' + path });
  t.after(() => dom.window.close());
  if (initial) dom.window.localStorage.setItem('compasso-v2', JSON.stringify(initial));
  // O jsdom mantém o atributo open. Escape, foco e modalidade são exercitados no Chromium.
  const dialog = dom.window.HTMLDialogElement.prototype;
  dialog.showModal ??= function () { this.open = true; };
  dialog.close ??= function () { this.open = false; this.dispatchEvent(new dom.window.Event('close')); };
  const app = startApp(dom.window, { api });
  return { window: dom.window, document: dom.window.document, app };
}

function fill(window, values) {
  for (const [name, value] of Object.entries(values)) {
    const field = window.document.querySelector(`[name="${name}"]`);
    assert.ok(field, `Campo ${name} deve existir`);
    field.value = value;
    field.dispatchEvent(new window.Event('input', { bubbles: true }));
  }
}

async function submit(ctx) {
  ctx.document.querySelector('form').dispatchEvent(new ctx.window.Event('submit', { bubbles: true, cancelable: true }));
  await ctx.app.idle();
}

test('cadastro válido envia nome artístico no contrato e abre painel', async t => {
  let logged = false;
  const ctx = open(t, '/cadastro', async (path, body) => {
    if (path === '/api/session') return logged ? account() : null;
    assert.equal(path, '/api/register');
    assert.equal(body.name, 'Davi');
    assert.equal(body.slug, 'davi-viola');
    logged = true;
    return { ok: true };
  });
  await ctx.app.ready;
  fill(ctx.window, { fullName: 'Davi Balsamão', artistName: 'Davi', email: 'davi@example.com', password: 'senha123!', slug: 'davi-viola' });
  await submit(ctx);
  assert.equal(ctx.window.location.pathname, '/painel');
  assert.match(ctx.document.querySelector('main').textContent, /Olá, Davi/);
  assert.equal(ctx.document.title, 'Painel | Compasso');
});

test('perfil preserva texto após falha e restaura o Instagram normalizado após salvar', async t => {
  let saved = account();
  let fail = true;
  const ctx = open(t, '/perfil', async (path, body) => {
    if (path === '/api/session') return saved;
    assert.equal(path, '/api/draft');
    if (fail) throw new Error('Sem conexão');
    saved = { ...body, revision: 1, profile: { ...body.profile, instagram: 'https://www.instagram.com/davi/' } };
    return saved;
  });
  await ctx.app.ready;
  fill(ctx.window, { name: 'Davi', instrument: 'Viola', instagram: '@davi', bio: 'Minha trajetória' });
  await submit(ctx);
  assert.match(ctx.document.querySelector('[data-error]').textContent, /Sem conexão/);
  assert.equal(ctx.document.querySelector('[name="bio"]').value, 'Minha trajetória');
  fail = false;
  await submit(ctx);
  assert.equal(ctx.document.querySelector('[name="instagram"]').value, 'https://www.instagram.com/davi/');
  const reload = open(t, '/perfil', async () => saved);
  await reload.app.ready;
  assert.equal(reload.document.querySelector('[name="bio"]').value, 'Minha trajetória');
});

test('trabalhos só mudam após salvar; cancelar edição e falhar preservam lista', async t => {
  let saved = account();
  let fail = false;
  const ctx = open(t, '/trabalhos', async (path, body) => {
    if (path === '/api/session') return saved;
    if (fail) throw new Error('Sem conexão');
    saved = { ...saved, ...body, revision: saved.revision + 1 };
    return saved;
  });
  await ctx.app.ready;
  ctx.document.querySelector('[data-new]').click();
  assert.equal(ctx.document.querySelector('dialog').open, true);
  fill(ctx.window, { title: 'Recital', url: 'https://example.com/recital' });
  await submit(ctx);
  assert.equal(ctx.document.querySelectorAll('[data-edit]').length, 1);
  ctx.document.querySelector('[data-edit]').click();
  fill(ctx.window, { title: 'Não salvar' });
  ctx.document.querySelector('[data-cancel]').click();
  assert.equal(ctx.document.querySelector('dialog').open, false);
  assert.match(ctx.document.querySelector('[data-list]').textContent, /Recital/);
  assert.doesNotMatch(ctx.document.querySelector('[data-list]').textContent, /Não salvar/);
  ctx.document.querySelector('[data-edit]').click();
  fill(ctx.window, { title: 'Nova versão' });
  fail = true;
  await submit(ctx);
  assert.equal(ctx.document.querySelector('[name="title"]').value, 'Nova versão');
  assert.match(ctx.document.querySelector('[data-list]').textContent, /Recital/);
  fail = false;
  await submit(ctx);
  assert.match(ctx.document.querySelector('[data-list]').textContent, /Nova versão/);
  ctx.window.confirm = () => true;
  ctx.document.querySelector('[data-delete]').click();
  await ctx.app.idle();
  assert.equal(ctx.document.querySelectorAll('[data-edit]').length, 0);
});

test('agenda seleciona dia, mantém visibilidade na edição e permite cancelar exclusão', async t => {
  let saved = account();
  const ctx = open(t, '/agenda', async (path, body) => {
    if (path === '/api/session') return saved;
    saved = { ...saved, ...body, revision: saved.revision + 1 };
    return saved;
  });
  await ctx.app.ready;
  ctx.document.querySelector('[data-new]').click();
  const day = ctx.document.querySelector('[data-day]');
  day.click();
  assert.equal(ctx.document.querySelector('[name="date"]').value, day.dataset.day);
  fill(ctx.window, { title: 'Concerto', time: '19:30', venue: 'Sala', visibility: 'public' });
  await submit(ctx);
  ctx.document.querySelector('[data-edit]').click();
  assert.equal(ctx.document.querySelector('[name="visibility"]').value, 'public');
  ctx.document.querySelector('[data-cancel]').click();
  ctx.window.confirm = () => false;
  ctx.document.querySelector('[data-delete]').click();
  await ctx.app.idle();
  assert.equal(saved.events.length, 1);
  ctx.document.querySelector('[data-edit]').click();
  fill(ctx.window, { visibility: 'private' });
  await submit(ctx);
  assert.equal(saved.events[0].visibility, 'private');
});

test('cancelar preserva a publicação e confirmar envia uma atualização com a revisão atual', async t => {
  const saved = account();
  saved.profile.instrument = 'Viola';
  const previous = '2026-11-20T16:23:00.000Z';
  const next = '2026-11-25T20:45:12.000Z';
  saved.publication = { slug: saved.slug, ...newDraft('Versão publicada'), publishedAt: previous };
  let writes = 0;
  const response = Promise.withResolvers();
  const ctx = open(t, '/publicacao', async (path, body) => {
    if (path === '/api/session') return saved;
    assert.equal(path, '/api/publish');
    assert.deepEqual(body, { id: saved.id, revision: 0 });
    writes++;
    await response.promise;
    return { ...saved, revision: 1, publication: { ...saved, publishedAt: next } };
  });
  await ctx.app.ready;
  assert.match(ctx.document.querySelector('main').textContent, /Alterações pendentes/);
  const oldTime = ctx.document.querySelector('time');
  assert.equal(oldTime?.dateTime, previous);
  assert.ok(oldTime.textContent.includes(new Date(previous).toLocaleDateString('pt-BR')));
  assert.match(oldTime.textContent, /\d{2}:\d{2}/);
  const opener = ctx.document.querySelector('[data-publish]');
  opener.click();
  const dialog = ctx.document.querySelector('dialog[open]');
  assert.match(dialog.textContent, /https:\/\/compasso\.test\/a-musico/);
  dialog.querySelector('[data-cancel]').click();
  assert.equal(writes, 0);
  assert.equal(oldTime.dateTime, previous);
  opener.click();
  const confirm = dialog.querySelector('[type="submit"]');
  confirm.click();
  confirm.click();
  assert.equal(writes, 1);
  assert.equal(confirm.disabled, true);
  response.resolve();
  await ctx.app.idle();
  assert.equal(ctx.document.querySelector('time').dateTime, next);
  assert.match(ctx.document.querySelector('main').textContent, /Sem alterações pendentes/);
});

test('a primeira publicação pode ser cancelada e um erro permite nova tentativa', async t => {
  const saved = account();
  let writes = 0;
  const ctx = open(t, '/publicacao', async path => {
    if (path === '/api/session') return saved;
    writes++;
    if (writes === 1) throw new Error('Informe seu instrumento.');
    return { ...saved, revision: 1, publication: { ...saved, publishedAt: '2026-11-25T18:00:00Z' } };
  });
  await ctx.app.ready;
  const opener = ctx.document.querySelector('[data-publish]');
  opener.click();
  const dialog = ctx.document.querySelector('dialog[open]');
  assert.ok(dialog);
  dialog.querySelector('[data-cancel]').click();
  assert.equal(writes, 0);
  assert.equal(ctx.document.querySelector('time'), null);
  opener.click();
  await submit(ctx);
  assert.match(dialog.querySelector('[data-error]').textContent, /instrumento/);
  assert.equal(dialog.open, true);
  await submit(ctx);
  assert.equal(writes, 2);
  assert.equal(ctx.document.querySelector('dialog[open]'), null);
  assert.equal(ctx.document.querySelector('time').dateTime, '2026-11-25T18:00:00Z');
});

test('contato só confirma após a API concluir e conserva mensagem em caso de erro', async t => {
  let fail = true;
  const ctx = open(t, '/contato', async (path, body) => {
    if (path === '/api/session') return null;
    assert.equal(path, '/api/contact');
    assert.equal(body.message, 'Gostaria de conversar');
    if (fail) throw new Error('Não gravado');
    return { ok: true };
  });
  await ctx.app.ready;
  fill(ctx.window, { email: 'visitante@example.com', message: 'Gostaria de conversar' });
  await submit(ctx);
  assert.equal(ctx.document.querySelector('[name="message"]').value, 'Gostaria de conversar');
  assert.doesNotMatch(ctx.document.body.textContent, /Mensagem recebida/);
  fail = false;
  await submit(ctx);
  assert.match(ctx.document.body.textContent, /Mensagem recebida/);
  assert.equal(ctx.document.querySelector('main a[href="/"]')?.textContent, 'Voltar ao início');
  assert.equal(ctx.document.querySelector('main a[href="/"]').hidden, false);
  assert.equal(ctx.document.querySelector('[name="message"]').value, '');
});

test('conflito preserva formulário; recarregar exige confirmação e usa revisão nova', async t => {
  let saved = account();
  const ctx = open(t, '/perfil', async (path) => {
    if (path === '/api/session') return structuredClone(saved);
    throw Object.assign(new Error('A conta ou o rascunho mudou. Recarregue a página.'), { status: 409 });
  });
  await ctx.app.ready;
  fill(ctx.window, { bio: 'Edição desta aba' });
  saved = { ...saved, revision: 2, profile: { ...saved.profile, bio: 'Outra aba' } };
  await submit(ctx);
  assert.equal(ctx.document.querySelector('[name="bio"]').value, 'Edição desta aba');
  ctx.window.confirm = () => false;
  ctx.document.querySelector('[data-reload]').click();
  await ctx.app.idle();
  assert.equal(ctx.document.querySelector('[name="bio"]').value, 'Edição desta aba');
  ctx.window.confirm = () => true;
  ctx.document.querySelector('[data-reload]').click();
  await ctx.app.idle();
  assert.equal(ctx.document.querySelector('[name="bio"]').value, 'Outra aba');
});

test('importação pede confirmação, salva legado e preserva publicação', async t => {
  const saved = account();
  saved.publication = { ...newDraft('Público'), slug: saved.slug };
  const legacy = newDraft('Legado');
  const ctx = open(t, '/painel', async (path, body) => {
    if (path === '/api/session') return saved;
    assert.equal(body.profile.name, 'Legado');
    assert.equal(body.publication, undefined);
    return { ...saved, ...body, revision: 1 };
  }, legacy);
  await ctx.app.ready;
  ctx.window.confirm = () => true;
  ctx.document.querySelector('[data-import]').click();
  await ctx.app.idle();
  assert.match(ctx.document.querySelector('main h1')?.textContent, /Legado/);
  ctx.document.querySelector('a[href="/publicacao"]').click();
  await ctx.app.idle();
  assert.match(ctx.document.querySelector('main').textContent, /Portfólio publicado/);
});

test('slug ocupado marca e-mail e endereço, mantendo todos os campos', async t => {
  const ctx = open(t, '/cadastro', async path => {
    if (path === '/api/session') return null;
    throw Object.assign(new Error('Este e-mail ou endereço de portfólio já está em uso.'), { status: 409 });
  });
  await ctx.app.ready;
  fill(ctx.window, { fullName: 'Davi Balsamão', artistName: 'Davi', email: 'davi@example.com', password: 'Senha123!', slug: 'ocupado' });
  await submit(ctx);
  for (const name of ['email', 'slug']) assert.equal(ctx.document.querySelector(`[name="${name}"]`).getAttribute('aria-invalid'), 'true');
  assert.equal(ctx.document.querySelector('[name="artistName"]').value, 'Davi');
  assert.equal(ctx.document.querySelector('[name="slug"]').value, 'ocupado');
  assert.equal(ctx.document.querySelector('[name="password"]').value, 'Senha123!');
});

test('formulário recusa as senhas fora do contrato e mantém a ajuda após o erro', async t => {
  const ctx = open(t, '/cadastro', async path => { assert.equal(path, '/api/session'); return null; });
  await ctx.app.ready;
  fill(ctx.window, { fullName: 'Davi', artistName: 'Davi', email: 'davi@example.com', slug: 'davi' });
  const field = ctx.document.querySelector('[name="password"]');
  for (const password of ['abcdefg!', 'abcdefghi', 'a'.repeat(128) + '!']) {
    fill(ctx.window, { password });
    await submit(ctx);
    assert.equal(field.getAttribute('aria-invalid'), 'true');
    assert.match(field.getAttribute('aria-describedby'), /ajuda-senha/);
    assert.match(ctx.document.querySelector('[data-error]').textContent, /9 a 128/);
  }
});

test('visitante não abre painel; entrada recusada preserva e-mail', async t => {
  const ctx = open(t, '/painel', async path => {
    if (path === '/api/session') return null;
    throw Object.assign(new Error('E-mail ou senha incorretos.'), { status: 401 });
  });
  await ctx.app.ready;
  assert.equal(ctx.window.location.pathname, '/entrar');
  fill(ctx.window, { email: 'davi@example.com', password: 'Senha123!' });
  await submit(ctx);
  assert.match(ctx.document.querySelector('[data-error]').textContent, /incorretos/);
  assert.equal(ctx.document.querySelector('[name="email"]').value, 'davi@example.com');
  assert.equal(ctx.document.querySelector('[data-private]').hidden, true);
});

test('sair limpa estado; nova entrada restaura apenas a segunda conta', async t => {
  let current = account('Davi', 'davi');
  const ctx = open(t, '/painel', async (path, body) => {
    if (path === '/api/logout') { current = null; return { ok: true }; }
    if (path === '/api/login') { assert.equal(body.email, 'luis@example.com'); current = account('Luís', 'luis'); return { ok: true }; }
    return current;
  });
  await ctx.app.ready;
  assert.match(ctx.document.querySelector('main h1')?.textContent, /Davi/);
  ctx.document.querySelector('[data-logout]').click();
  await ctx.app.idle();
  ctx.window.history.pushState(null, '', '/painel');
  ctx.window.dispatchEvent(new ctx.window.PopStateEvent('popstate'));
  await ctx.app.idle();
  assert.equal(ctx.window.location.pathname, '/entrar');
  fill(ctx.window, { email: 'luis@example.com', password: 'Senha123!' });
  await submit(ctx);
  assert.match(ctx.document.querySelector('main h1')?.textContent, /Luís/);
  assert.doesNotMatch(ctx.document.querySelector('main').textContent, /Davi/);
});

test('sessão expirada durante salvamento limpa a área privada', async t => {
  const ctx = open(t, '/perfil', async path => {
    if (path === '/api/session') return account();
    throw Object.assign(new Error('Entre para editar seu portfólio.'), { status: 401 });
  });
  await ctx.app.ready;
  fill(ctx.window, { bio: 'Texto privado' });
  await submit(ctx);
  assert.equal(ctx.window.location.pathname, '/entrar');
  assert.equal(ctx.document.querySelector('[data-private]').hidden, true);
  assert.doesNotMatch(ctx.document.body.textContent, /Texto privado/);
});

test('perfil inválido preserva campos sem enviar para API', async t => {
  const ctx = open(t, '/perfil', async path => { assert.equal(path, '/api/session'); return account(); });
  await ctx.app.ready;
  fill(ctx.window, { instagram: 'https://outro.example/davi', bio: 'Minha história' });
  await submit(ctx);
  assert.equal(ctx.document.querySelector('[name="instagram"]').getAttribute('aria-invalid'), 'true');
  assert.equal(ctx.document.querySelector('[name="bio"]').value, 'Minha história');
});

test('explorar combina texto e instrumento em tempo real e restaura o catálogo', async t => {
  const davi = account('Davi', 'davi');
  Object.assign(davi.profile, { instrument: 'Viola', city: 'São Paulo' });
  const bia = account('Bia', 'bia');
  Object.assign(bia.profile, { instrument: 'Piano', city: 'Belo Horizonte' });
  const catalog = [davi, bia];
  const ctx = open(t, '/explorar', async path => {
    if (path === '/api/session') return null;
    const query = new URL(path, 'https://compasso.test').searchParams;
    return searchArtists(catalog, query.get('q'), query.get('instrument'));
  });
  await ctx.app.ready;
  const instrument = ctx.document.querySelector('select[name="instrument"]');
  assert.ok(instrument, 'o instrumento deve ser um seletor');
  assert.deepEqual([...instrument.options].map(option => option.value), ['', 'Piano', 'Viola']);
  const names = () => [...ctx.document.querySelectorAll('[data-results] h3')].map(node => node.textContent);
  function choose(value) {
    instrument.value = value;
    instrument.dispatchEvent(new ctx.window.Event('change', { bubbles: true }));
    return ctx.app.idle();
  }
  fill(ctx.window, { q: 'davi' });
  await ctx.app.idle();
  assert.deepEqual(names(), ['Davi']);
  await choose('Piano');
  assert.match(ctx.document.querySelector('[data-results]').textContent, /Nenhum músico/);
  fill(ctx.window, { q: '' });
  await ctx.app.idle();
  assert.deepEqual(names(), ['Bia']);
  await choose('');
  assert.deepEqual(names(), ['Davi', 'Bia']);
  fill(ctx.window, { q: 'sao paulo' });
  await ctx.app.idle();
  assert.deepEqual(names(), ['Davi']);
  ctx.document.querySelector('[data-demo]').click();
  assert.match(ctx.document.querySelector('[data-demo-content]').textContent, /Luís Henrique/);
  ctx.document.querySelector('[data-results] a').click();
  await ctx.app.idle();
  assert.equal(ctx.window.location.pathname, '/davi-musico');
  assert.equal(ctx.document.title, 'Davi | Compasso');
  assert.equal(ctx.document.querySelector('main h1').textContent, 'Davi');
});

test('resposta de catálogo atrasada não substitui a página de contato', async t => {
  let resolve;
  const ctx = open(t, '/', async path => {
    if (path === '/api/session') return null;
    if (path === '/api/artists?') return new Promise(done => { resolve = done; });
    return [];
  });
  await ctx.app.ready;
  ctx.document.querySelector('a[href="/explorar"]').click();
  const search = ctx.app.idle();
  ctx.document.querySelector('a[href="/contato"]').click();
  resolve([]);
  await search;
  assert.equal(ctx.document.querySelector('main h1')?.textContent, 'Fale com a equipe');
});

test('portfólio ausente e rede indisponível oferecem mensagens sem dados privados', async t => {
  const absent = open(t, '/nao-publicado', async path => path === '/api/session' ? null : []);
  await absent.app.ready;
  assert.match(absent.document.querySelector('main').textContent, /Portfólio não encontrado/);
  const broken = open(t, '/musico', async () => { throw new Error('Sem conexão'); });
  await broken.app.ready;
  assert.match(broken.document.querySelector('main').textContent, /Sem conexão/);
});

test('agenda filtra lista e navega entre meses sem perder o formulário', async t => {
  const saved = account();
  saved.events = [{ id: 'e1', title: 'Recital', date: '2030-06-15', time: '19:00', venue: 'Sala' }];
  const ctx = open(t, '/agenda', async () => saved);
  await ctx.app.ready;
  fill(ctx.window, { filter: 'ausente' });
  ctx.document.querySelector('[data-new]').click();
  fill(ctx.window, { title: 'Não perder' });
  assert.match(ctx.document.querySelector('[data-list]').textContent, /Nenhuma apresentação/);
  for (let i = 0; i < 13; i++) ctx.document.querySelector('[data-month="1"]').click();
  for (let i = 0; i < 13; i++) ctx.document.querySelector('[data-month="-1"]').click();
  assert.equal(ctx.document.querySelector('[name="title"]').value, 'Não perder');
  ctx.document.querySelector('[data-cancel]').click();
  fill(ctx.window, { filter: '' });
  ctx.document.querySelector('[data-edit]').click();
  assert.equal(ctx.document.querySelector('[name="visibility"]').value, 'private');
});

test('retirada pede confirmação e preserva rascunho', async t => {
  const saved = account();
  saved.publication = { ...newDraft('Público'), slug: saved.slug };
  let count = 0;
  const ctx = open(t, '/publicacao', async path => {
    if (path === '/api/session') return saved;
    assert.equal(path, '/api/unpublish');
    count++;
    return { ...saved, publication: null, revision: 1 };
  });
  await ctx.app.ready;
  ctx.window.confirm = () => false;
  ctx.document.querySelector('[data-unpublish]').click();
  assert.equal(count, 0);
  ctx.window.confirm = () => true;
  ctx.document.querySelector('[data-unpublish]').click();
  await ctx.app.idle();
  assert.equal(count, 1);
  ctx.document.querySelector('a[href="/previa"]').click();
  await ctx.app.idle();
  assert.equal(ctx.document.querySelector('main h1')?.textContent, 'Davi');
});

test('busca mais recente prevalece sobre o catálogo inicial atrasado', async t => {
  let finishInitial;
  const ctx = open(t, '/', async path => {
    if (path === '/api/session') return null;
    if (path === '/api/artists?') return new Promise(resolve => { finishInitial = resolve; });
    return [];
  });
  await ctx.app.ready;
  ctx.document.querySelector('a[href="/explorar"]').click();
  const initial = ctx.app.idle();
  fill(ctx.window, { q: 'ausente' });
  const latest = ctx.app.idle();
  assert.notEqual(latest, initial, 'digitar deve iniciar outra busca');
  await latest;
  const late = account('Bia');
  late.profile.instrument = 'Piano';
  finishInitial([late]);
  await initial;
  assert.match(ctx.document.querySelector('[data-results]').textContent, /Nenhum músico/);
  assert.equal(ctx.document.querySelector('select option:last-child')?.value, 'Piano');
});

for (const [route, collection, fields] of [
  ['/trabalhos', 'works', { url: 'https://example.com/recital' }],
  ['/agenda', 'events', { date: '2026-11-24', time: '19:30', venue: 'Auditório' }],
]) {
  for (const delayed of [false, true]) {
    const scenario = delayed ? 'voltar durante salvamento' : 'cancelar edição';
    test(`preserva os dois registros em ${route} após ${scenario}`, async t => {
      let saved = account();
      const started = Promise.withResolvers();
      const response = Promise.withResolvers();
      const api = async (path, body) => {
        if (path === '/api/session') return structuredClone(saved);
        assert.equal(path, '/api/draft');
        assert.equal(body.revision, saved.revision);
        saved = { ...saved, ...body, revision: saved.revision + 1 };
        if (delayed && saved.revision === 1) {
          started.resolve();
          await response.promise;
        }
        return structuredClone(saved);
      };
      const ctx = open(t, route, api);
      await ctx.app.ready;
      ctx.document.querySelector('[data-new]').click();
      fill(ctx.window, { ...fields, title: 'Recital A' });
      const firstSave = submit(ctx);
      if (delayed) {
        await started.promise;
        for (const path of ['/painel', route]) {
          ctx.document.querySelector(`a[href="${path}"]`).click();
          await ctx.app.idle();
        }
        response.resolve();
      }
      await firstSave;
      if (!delayed) {
        ctx.document.querySelector('[data-edit]').click();
        ctx.document.querySelector('[data-cancel]').click();
      }
      ctx.document.querySelector('[data-new]').click();
      fill(ctx.window, { ...fields, title: 'Recital B' });
      await submit(ctx);
      assert.deepEqual(saved[collection].map(item => item.title), ['Recital A', 'Recital B']);
      const reload = open(t, route, api);
      await reload.app.ready;
      assert.equal(reload.document.querySelectorAll('[data-edit]').length, 2);
    });
  }
}

test('vitrine usa no máximo três portfólios publicados e restaura o acesso do músico', async t => {
  const artists = ['Ana', 'Bia', 'Caio', 'Dora'].map(name => account(name, name.toLowerCase()));
  const ctx = open(t, '/', async path => {
    if (path === '/api/session') return account('Nome do rascunho');
    assert.equal(path, '/api/artists');
    return artists;
  });
  await ctx.app.ready;
  const featured = ctx.document.querySelector('[aria-labelledby="titulo-vitrine"]');
  assert.ok(featured, 'a home deve exibir a vitrine');
  assert.deepEqual([...featured.querySelectorAll('li a')].map(link => link.pathname),
    ['/ana-musico', '/bia-musico', '/caio-musico']);
  assert.doesNotMatch(featured.textContent, /Nome do rascunho|Dora|Luís Henrique/);
  assert.equal(ctx.document.querySelector('[data-home-account]').pathname, '/painel');
  assert.equal(ctx.document.querySelector('[data-guest]').hidden, true);
});

test('vitrine vazia informa a ausência de publicações sem inserir a demonstração', async t => {
  const ctx = open(t, '/', async path => path === '/api/session' ? null : []);
  await ctx.app.ready;
  const featured = ctx.document.querySelector('[aria-labelledby="titulo-vitrine"]');
  assert.match(featured?.textContent ?? '', /Ainda não há portfólios publicados/);
  assert.equal(featured.querySelector('li a'), null);
  assert.equal(ctx.document.querySelector('[data-home-account]').pathname, '/cadastro');
});

test('falha no catálogo deixa as ações da home disponíveis e distingue erro de catálogo vazio', async t => {
  const ctx = open(t, '/', async path => {
    if (path === '/api/session') return null;
    throw new Error('Sem conexão');
  });
  await ctx.app.ready;
  assert.match(ctx.document.querySelector('main').textContent, /Não foi possível carregar os músicos/);
  assert.ok(ctx.document.querySelector('main a[href="/explorar"]'));
});

test('resposta tardia da vitrine não altera a próxima página', async t => {
  const loading = Promise.withResolvers();
  const ctx = open(t, '/', async path => path === '/api/session' ? null : loading.promise);
  ctx.document.querySelector('a[href="/contato"]').click();
  loading.resolve([account('Artista atrasado')]);
  await ctx.app.ready;
  assert.ok(ctx.document.querySelector('textarea[name="message"]'));
  assert.doesNotMatch(ctx.document.querySelector('main').textContent, /Artista atrasado/);
});

test('área do músico indica a seção ativa e separa o painel da prévia', async t => {
  const saved = account('Davi');
  const ctx = open(t, '/painel', async () => saved);
  await ctx.app.ready;
  const sidebar = ctx.document.querySelector('[data-private]');
  const currentLink = () => sidebar.querySelector('[aria-current="page"]');
  assert.equal(currentLink()?.pathname, '/painel');
  const calendar = ctx.document.querySelector('[data-calendar]');
  assert.ok(calendar, 'o painel deve mostrar o calendário do mês');
  assert.match(calendar.textContent, /Dia com apresentação/);
  const month = calendar.querySelector('h3').textContent;
  calendar.querySelector('[data-month="1"]').click();
  assert.notEqual(calendar.querySelector('h3').textContent, month);
  calendar.querySelector('[data-month="-1"]').click();
  assert.equal(calendar.querySelector('h3').textContent, month);
  ctx.document.querySelector('main a[href="/agenda?novo=1"]').click();
  await ctx.app.idle();
  assert.equal(ctx.document.querySelector('dialog').open, true);
  assert.equal(ctx.window.location.search, '');
  ctx.document.querySelector('[data-cancel]').click();
  sidebar.querySelector('a[href="/perfil"]').click();
  await ctx.app.idle();
  assert.equal(currentLink()?.pathname, '/perfil');
  ctx.document.querySelector('header a[aria-label="Visualizar prévia"]').click();  await ctx.app.idle();
  assert.equal(sidebar.hidden, true);
  assert.equal(ctx.document.querySelector('main h1').textContent, 'Davi');
  ctx.document.querySelector('[data-member] a[href="/painel"]').click();
  await ctx.app.idle();
  assert.equal(currentLink()?.pathname, '/painel');
});

test('agenda combina o período e a busca sem ocultar registros antigos da lista completa', async t => {
  const saved = account();
  saved.events = [
    { id: 'a', title: 'Recital anterior', date: '2010-01-05', time: '09:00', venue: 'Sala' },
    { id: 'b', title: 'Recital futuro', date: '2099-06-01', venue: 'Teatro' },
    { id: 'c', title: 'Recital noturno', date: '2010-01-05', time: '19:00', venue: 'Sala' },
    { id: 'd', title: 'Recital seguinte', date: '2011-01-05', time: '09:00', venue: 'Sala' },
  ];
  const ctx = open(t, '/agenda', async () => saved);
  await ctx.app.ready;
  const list = ctx.document.querySelector('[data-list]');
  assert.equal(list.querySelectorAll('li').length, 4);
  assert.equal(ctx.document.querySelector('.side-nav [href="/agenda"] .nav-count')?.textContent, '1');
  ctx.document.querySelector('[value="past"]').click();
  assert.deepEqual([...list.querySelectorAll('h3')].map(node => node.textContent),
    ['Recital seguinte', 'Recital noturno', 'Recital anterior']);
  assert.doesNotMatch(list.textContent, /Recital futuro/);
  ctx.document.querySelector('[value="upcoming"]').click();
  fill(ctx.window, { filter: 'Sala' });
  assert.match(list.textContent, /Nenhuma apresentação/);
  fill(ctx.window, { filter: 'Teatro' });
  assert.match(list.textContent, /Recital futuro/);
});

test('conflito ao editar trabalho oferece recarga dentro do próprio editor', async t => {
  const ctx = open(t, '/trabalhos', async path => {
    if (path === '/api/session') return account();
    throw Object.assign(new Error('O rascunho mudou.'), { status: 409 });
  });
  await ctx.app.ready;
  ctx.document.querySelector('[data-new]').click();
  fill(ctx.window, { title: 'Gravação', url: 'https://example.org/video' });
  await submit(ctx);
  const dialog = ctx.document.querySelector('dialog[open]');
  assert.ok(dialog?.querySelector('[data-reload]'));
  assert.equal(dialog.querySelector('[name="title"]').value, 'Gravação');
});

test('exclusão concluída em segundo plano conserva os campos da página seguinte', async t => {
  const saved = account();
  saved.works = [{ id: 'a', title: 'Recital', url: 'https://example.org/recital' }];
  const response = Promise.withResolvers();
  const ctx = open(t, '/trabalhos', async path => path === '/api/session' ? saved : response.promise);
  await ctx.app.ready;
  ctx.window.confirm = () => true;
  ctx.document.querySelector('[data-delete]').click();
  const deletion = ctx.app.idle();
  ctx.document.querySelector('[data-private] a[href="/perfil"]').click();
  await ctx.app.idle();
  fill(ctx.window, { bio: 'Trajetória em edição' });
  response.resolve({ ...saved, revision: 1, works: [] });
  await deletion;
  assert.equal(ctx.document.querySelector('[name="bio"]').value, 'Trajetória em edição');
});

test('excluir um trabalho conserva a edição de outro iniciada durante a gravação', async t => {
  const saved = account();
  saved.works = ['a', 'b'].map(id => ({ id, title: 'Trabalho ' + id, url: 'https://example.org/' + id }));
  const response = Promise.withResolvers();
  const ctx = open(t, '/trabalhos', async path => path === '/api/session' ? saved : response.promise);
  await ctx.app.ready;
  ctx.window.confirm = () => true;
  ctx.document.querySelector('[data-delete="a"]').click();
  const deletion = ctx.app.idle();
  ctx.document.querySelector('[data-edit="b"]').click();
  fill(ctx.window, { title: 'Ainda escrevendo' });
  response.resolve({ ...saved, revision: 1, works: saved.works.slice(1) });
  await deletion;
  assert.equal(ctx.document.querySelector('dialog').open, true);
  assert.equal(ctx.document.querySelector('[name="title"]').value, 'Ainda escrevendo');
  ctx.document.querySelector('[data-cancel]').click();
  await ctx.app.idle();
  assert.equal(ctx.document.querySelector('[data-edit="a"]'), null);
  assert.ok(ctx.document.querySelector('[data-edit="b"]'));
});

test('um erro de busca atrasado não apaga os resultados mais recentes', async t => {
  const delayed = Promise.withResolvers();
  const ctx = open(t, '/explorar', async path => {
    if (path === '/api/session') return null;
    if (path.includes('q=antiga')) return delayed.promise;
    return [account('Bia')];
  });
  await ctx.app.ready;
  fill(ctx.window, { q: 'antiga' });
  const old = ctx.app.idle();
  assert.notEqual(old, ctx.app.ready, 'a primeira busca deve ter começado');
  fill(ctx.window, { q: 'Bia' });
  await ctx.app.idle();
  delayed.reject(new Error('A busca anterior falhou'));
  await old;
  assert.equal(ctx.document.querySelector('[data-results] h3').textContent, 'Bia');
  assert.doesNotMatch(ctx.document.body.textContent, /A busca anterior falhou/);
});

for (const [path, collection, extra, defaultType, chosen] of [
  ['/trabalhos', 'works', { url: 'https://example.org/obra' }, 'Interpretação', 'Projeto'],
  ['/agenda', 'events', { date: '2030-06-15', time: '20:00', venue: 'Sala' }, 'Recital', 'Concerto'],
]) {
  test(`${path}: oferece categorias e preserva o tipo de registros anteriores`, async t => {
    let saved = account();
    const legacy = 'Performance & improviso';
    saved[collection] = [
      { id: 'antigo', title: 'Registro antigo', type: legacy, ...extra },
      { id: 'vazio', title: 'Sem classificação', ...extra },
    ];
    const ctx = open(t, path, async (route, body) => {
      if (route === '/api/session') return saved;
      saved = { ...saved, ...body, revision: saved.revision + 1 };
      return saved;
    });
    await ctx.app.ready;
    const type = () => ctx.document.querySelector('dialog select[name="type"]');
    const click = selector => ctx.document.querySelector(selector).click();
    click('[data-edit="antigo"]');
    assert.equal(type()?.value, legacy);
    fill(ctx.window, { title: 'Atualizado' });
    await submit(ctx);
    assert.equal(saved[collection][0].type, legacy);
    click('[data-edit="vazio"]');
    assert.equal(type().value, '');
    click('[data-cancel]');
    click('[data-edit="antigo"]');
    type().value = chosen;
    click('[data-cancel]');
    assert.equal(saved[collection][0].type, legacy);
    click('[data-new]');
    assert.equal(type().value, defaultType);
    assert.equal([...type().options].some(option => option.value === legacy), false);
    fill(ctx.window, { ...extra, title: 'Novo', type: chosen });
    await submit(ctx);
    assert.equal(saved[collection].at(-1).type, chosen);
    assert.equal(ctx.document.activeElement, ctx.document.querySelector('[data-new]'));
  });
}
