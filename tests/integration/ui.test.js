import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { startApp } from '../../src/app.js';
import { newDraft } from '../../src/domain/account.js';

function account(name = 'Davi', id = 'a') {
  return { id, slug: id + '-musico', revision: 0, ...newDraft(name), publication: null };
}

function open(t, path, api, initial) {
  const dom = new JSDOM('<div id="app"></div>', { url: 'https://compasso.test' + path });
  t.after(() => dom.window.close());
  if (initial) dom.window.localStorage.setItem('compasso-v2', JSON.stringify(initial));
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
  assert.match(ctx.document.querySelector('main').textContent, /Davi/);
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
  fill(ctx.window, { title: 'Recital', url: 'https://example.com/recital' });
  await submit(ctx);
  assert.equal(ctx.document.querySelectorAll('[data-edit]').length, 1);
  ctx.document.querySelector('[data-edit]').click();
  fill(ctx.window, { title: 'Não salvar' });
  ctx.document.querySelector('[data-cancel]').click();
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
  const day = ctx.document.querySelector('[data-day]');
  day.click();
  assert.equal(ctx.document.querySelector('[name="date"]').value, day.dataset.day);
  fill(ctx.window, { title: 'Concerto', time: '19:30', venue: 'Sala', visibility: 'public' });
  await submit(ctx);
  ctx.document.querySelector('[data-edit]').click();
  assert.equal(ctx.document.querySelector('[name="visibility"]').value, 'public');
  ctx.window.confirm = () => false;
  ctx.document.querySelector('[data-delete]').click();
  await ctx.app.idle();
  assert.equal(saved.events.length, 1);
  fill(ctx.window, { visibility: 'private' });
  await submit(ctx);
  assert.equal(saved.events[0].visibility, 'private');
});

test('publicação mantém a versão anterior enquanto o perfil do rascunho muda', async t => {
  const saved = account();
  saved.profile.instrument = 'Viola';
  saved.publication = { slug: saved.slug, ...newDraft('Versão publicada') };
  const ctx = open(t, '/publicacao', async (path, body) => {
    if (path === '/api/session') return saved;
    assert.equal(path, '/api/publish');
    assert.deepEqual(body, { id: saved.id, revision: 0 });
    return { ...saved, revision: 1, publication: { ...saved, publishedAt: '2026-11-23' } };
  });
  await ctx.app.ready;
  assert.match(ctx.document.querySelector('main').textContent, /Alterações pendentes/);
  ctx.document.querySelector('[data-publish]').click();
  await ctx.app.idle();
  assert.match(ctx.document.querySelector('main').textContent, /Sem alterações pendentes/);
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
  assert.match(ctx.document.querySelector('h2').textContent, /Legado/);
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

test('cadastro com senha inválida recusa antes de enviar e marca o campo', async t => {
  const ctx = open(t, '/cadastro', async path => { assert.equal(path, '/api/session'); return null; });
  await ctx.app.ready;
  fill(ctx.window, { fullName: 'Davi', artistName: 'Davi', email: 'davi@example.com', password: 'curta', slug: 'davi' });
  await submit(ctx);
  assert.equal(ctx.document.querySelector('[name="password"]').getAttribute('aria-invalid'), 'true');
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
  assert.match(ctx.document.querySelector('h2').textContent, /Davi/);
  ctx.document.querySelector('[data-logout]').click();
  await ctx.app.idle();
  ctx.window.history.pushState(null, '', '/painel');
  ctx.window.dispatchEvent(new ctx.window.PopStateEvent('popstate'));
  await ctx.app.idle();
  assert.equal(ctx.window.location.pathname, '/entrar');
  fill(ctx.window, { email: 'luis@example.com', password: 'Senha123!' });
  await submit(ctx);
  assert.match(ctx.document.querySelector('h2').textContent, /Luís/);
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

test('explorar filtra via API, abre músico e mostra catálogo de demonstração separado', async t => {
  const published = { ...account(), slug: 'davi-publico' };
  const paths = [];
  const ctx = open(t, '/explorar', async path => {
    paths.push(path);
    if (path === '/api/session') return null;
    return path.includes('q=ausente') ? [] : [published];
  });
  await ctx.app.ready;
  ctx.document.querySelector('[data-demo]').click();
  assert.match(ctx.document.querySelector('[data-demo-content]').textContent, /Luís Henrique/);
  fill(ctx.window, { q: 'ausente', instrument: 'Viola' });
  await submit(ctx);
  assert.ok(paths.includes('/api/artists?q=ausente&instrument=Viola'));
  assert.match(ctx.document.querySelector('[data-results]').textContent, /Nenhum músico/);
  fill(ctx.window, { q: '', instrument: '' });
  await submit(ctx);
  ctx.document.querySelector('[data-results] a').click();
  await ctx.app.idle();
  assert.equal(ctx.window.location.pathname, '/davi-publico');
  assert.equal(ctx.document.querySelector('h2').textContent, 'Davi');
  assert.equal(ctx.document.querySelector('[data-private]').hidden, true);
});

test('resposta de catálogo atrasada não substitui a página de contato', async t => {
  let resolve;
  const ctx = open(t, '/', async path => path === '/api/session' ? null : new Promise(done => { resolve = done; }));
  await ctx.app.ready;
  ctx.document.querySelector('a[href="/explorar"]').click();
  const search = ctx.app.idle();
  ctx.document.querySelector('a[href="/contato"]').click();
  resolve([]);
  await search;
  assert.equal(ctx.document.querySelector('h2').textContent, 'Fale com a equipe');
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
  fill(ctx.window, { title: 'Não perder', filter: 'ausente' });
  assert.match(ctx.document.querySelector('[data-list]').textContent, /Nenhuma apresentação/);
  for (let i = 0; i < 13; i++) ctx.document.querySelector('[data-month="1"]').click();
  for (let i = 0; i < 13; i++) ctx.document.querySelector('[data-month="-1"]').click();
  assert.equal(ctx.document.querySelector('[name="title"]').value, 'Não perder');
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
  assert.equal(ctx.document.querySelector('h2').textContent, 'Davi');
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
  await submit(ctx);
  finishInitial([account()]);
  await initial;
  assert.match(ctx.document.querySelector('[data-results]').textContent, /Nenhum músico/);
});
