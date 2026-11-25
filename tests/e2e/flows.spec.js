import { readFile } from 'node:fs/promises';
import { test, expect, register, profile, event, publish } from './fixtures.js';

test('20 · cadastra, ajusta slug, sai e entra novamente', async ({ page, identity }) => {
  await register(page, identity);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.getByLabel('E-mail', { exact: true }).fill(identity.email);
  await page.getByLabel('Senha', { exact: true }).fill(identity.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Painel de ' + identity.name })).toBeVisible();
});

test('24 · perfil e Instagram persistem após recarga e podem ser apagados', async ({ page, artist }) => {
  await profile(page, artist.name);
  await page.reload();
  await expect(page.getByLabel('Instagram (usuário ou link)')).toHaveValue('https://www.instagram.com/davi/');
  await page.getByLabel('Instagram (usuário ou link)').fill('');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toHaveText('Perfil salvo.');
  await page.reload();
  await expect(page.getByLabel('Instagram (usuário ou link)')).toHaveValue('');
});

test('30 · cria e localiza apresentação', async ({ page, artist }) => {
  await event(page, 'Recital ' + artist.slug);
  await page.getByLabel('Buscar apresentações').fill(artist.slug);
  await expect(page.getByRole('heading', { name: 'Recital ' + artist.slug })).toBeVisible();
});

test('30 · edita apresentação e recarrega', async ({ page, artist }) => {
  await event(page, artist.name);
  await page.getByRole('button', { name: 'Editar ' + artist.name, exact: true }).click();
  await page.getByLabel('Título', { exact: true }).fill('Concerto alterado');
  await page.getByLabel('Visibilidade').selectOption('public');
  await page.getByRole('button', { name: 'Salvar apresentação' }).click();
  await expect(page.getByRole('heading', { name: 'Concerto alterado' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Editar Concerto alterado', exact: true }).click();
  await expect(page.getByLabel('Visibilidade')).toHaveValue('public');
});

test('30 · exclui após confirmação e continua ausente na recarga', async ({ page, artist }) => {
  await event(page, artist.name);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Excluir ' + artist.name, exact: true }).click();
  await expect(page.getByText('Nenhuma apresentação encontrada.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Nenhuma apresentação encontrada.')).toBeVisible();
});

test('32 · adiciona trabalho e encontra na prévia', async ({ page, artist }) => {
  await page.getByRole('link', { name: 'Trabalhos', exact: true }).click();
  const addWork = page.getByRole('button', { name: 'Adicionar trabalho', exact: true });
  await addWork.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(addWork).toBeFocused();
  await addWork.click();
  await page.getByLabel('Título', { exact: true }).fill('Gravação ' + artist.name);
  await page.getByLabel('Link do trabalho').fill('https://example.com/gravacao');
  await page.getByRole('button', { name: 'Salvar trabalho' }).click();
  await expect(page.getByRole('heading', { name: 'Gravação ' + artist.name })).toBeVisible();
  await page.getByRole('link', { name: 'Prévia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gravação ' + artist.name })).toBeVisible();
});

test('36/44 · home separa público e músico, teclado e tela estreita', async ({ page, identity }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const hero = page.getByRole('region', { name: /Seu talento merece/ });
  const heading = hero.getByRole('heading', { level: 1 });
  const photo = hero.getByRole('img');
  const desktopText = await heading.boundingBox();
  const desktopPhoto = await photo.boundingBox();
  expect(desktopPhoto.x).toBeGreaterThanOrEqual(desktopText.x + desktopText.width);
  await page.setViewportSize({ width: 375, height: 812 });
  const mobileText = await heading.boundingBox();
  const mobilePhoto = await photo.boundingBox();
  expect(mobilePhoto.y).toBeGreaterThanOrEqual(mobileText.y + mobileText.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: 'Descobrir músicos', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Criar conta', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Descobrir músicos', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Encontre sua próxima escuta.', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Catálogo de demonstração' })).toBeVisible();
  await page.getByLabel('Nome, instrumento ou cidade').fill('sem-resultado-' + Date.now());
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Instrumento', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goBack();
  await expect(page.getByRole('heading', { name: /Seu talento merece/ })).toBeVisible();
  await register(page, identity);
  await page.getByRole('link', { name: 'Agenda', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Agenda', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Nova apresentação', exact: true }).click();
  await expect(page.getByLabel('Título', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Data', { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('34 · editar rascunho mantém a versão vista pelo visitante', async ({ page, artist, visitor }) => {
  await profile(page, artist.name);
  await publish(page);
  await profile(page, 'Nome ainda privado');
  await page.getByRole('link', { name: 'Publicação', exact: true }).click();
  const oldTime = await page.locator('.publication-panel time').getAttribute('datetime');
  const republish = page.getByRole('button', { name: 'Republicar' });
  await republish.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(new URL('/' + artist.slug, page.url()).href, { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(republish).toBeFocused();
  await expect(page.locator('.publication-panel time')).toHaveAttribute('datetime', oldTime);
  await visitor.goto('http://127.0.0.1:4183/' + artist.slug);
  await expect(visitor.getByRole('heading', { name: artist.name, exact: true })).toBeVisible();
  await expect(visitor.getByText('Nome ainda privado', { exact: true })).toHaveCount(0);
});

test('40 · retirada remove músico da busca e do endereço direto', async ({ page, artist, visitor }) => {
  await profile(page, artist.name);
  await publish(page);
  await visitor.goto('http://127.0.0.1:4183/explorar');
  await visitor.getByLabel('Nome, instrumento ou cidade').fill(artist.name);
  await expect(visitor.getByRole('link', { name: artist.name, exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Retirar publicação' }).click();
  await expect(page.getByText('Portfólio ainda não publicado.')).toBeVisible();
  await visitor.getByRole('searchbox').press('Enter');
  await expect(visitor.getByText('Nenhum músico encontrado.')).toBeVisible();
  expect((await visitor.goto('http://127.0.0.1:4183/' + artist.slug)).status()).toBe(404);
  await expect(visitor.getByText('Portfólio não encontrado.')).toBeVisible();
});

test('40 · acesso direto, republicação e privacidade da agenda', async ({ page, artist, visitor }) => {
  await profile(page, artist.name);
  const today = new Date('2030-06-15T12:00:00');
  await page.clock.setFixedTime(today);
  await visitor.clock.setFixedTime(today);
  await event(page, 'Ensaio privado', 'private', { date: '2030-06-16' });
  await event(page, 'Recital anterior', 'public', { date: '2030-06-14' });
  await event(page, 'Próximo recital', 'public', { date: '2030-06-16' });
  await event(page, 'Concerto público', 'public', {
    description: 'Quarteto de cordas', ticket: 'https://example.org/ingressos',
  });
  await page.getByRole('link', { name: 'Prévia', exact: true }).click();
  const titles = view => view.locator('#portfolio-agenda .event-info h3');
  await expect(titles(page)).toHaveText(['Concerto público', 'Próximo recital']);
  await page.getByRole('link', { name: 'Revisar publicação' }).click();
  await publish(page);
  expect((await visitor.goto('http://127.0.0.1:4183/' + artist.slug)).status()).toBe(200);
  await expect(visitor.getByRole('heading', { name: 'Concerto público' })).toBeVisible();
  await expect(titles(visitor)).toHaveText(['Concerto público', 'Próximo recital']);
  await expect(visitor.getByText('Ensaio privado', { exact: true })).toHaveCount(0);
  await expect(visitor.getByRole('banner').getByRole('link', { name: 'Explorar músicos' })).toBeVisible();
  const details = visitor.getByRole('button', { name: 'Ver detalhes de Concerto público' });
  await details.click();
  const dialog = visitor.getByRole('dialog', { name: 'Concerto público' });
  await expect(dialog.getByText('Quarteto de cordas')).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Ver ingressos' })).toHaveAttribute('href', 'https://example.org/ingressos');
  await visitor.keyboard.press('Escape');
  await expect(details).toBeFocused();
  await visitor.getByRole('navigation', { name: 'Seções do portfólio' }).getByRole('link', { name: 'Contato' }).click();
  await expect(visitor).toHaveURL('http://127.0.0.1:4183/' + artist.slug);
  await expect(visitor.getByRole('heading', { name: 'Vamos conversar?' })).toBeInViewport();
  await expect(visitor.getByRole('link', { name: 'Instagram', exact: true })).toHaveAttribute('href', 'https://www.instagram.com/davi/');
  await page.getByRole('link', { name: 'Agenda', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Concerto público', exact: true }).click();
  await page.getByLabel('Descrição').fill('Alteração só no rascunho');
  await page.getByLabel('Visibilidade').selectOption('private');
  await page.getByRole('button', { name: 'Salvar apresentação' }).click();
  await expect(page.getByRole('heading', { name: 'Concerto público' })).toBeVisible();
  const direct = 'http://127.0.0.1:4183/' + artist.slug + '#portfolio-trabalhos';
  await visitor.goto(direct);
  await visitor.reload();
  await expect(visitor.locator('#portfolio-trabalhos')).toBeInViewport();
  await expect(visitor).toHaveURL(direct);
  await details.click();
  await expect(dialog.getByText('Quarteto de cordas')).toBeVisible();
  await dialog.getByRole('button', { name: 'Fechar' }).click();
  await publish(page);
  await visitor.reload();
  await expect(titles(visitor)).toHaveText(['Próximo recital']);
  await page.getByRole('link', { name: 'Agenda', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Concerto público' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ensaio privado' })).toBeVisible();
});

test('38 · contato confirma recebimento somente após resposta de gravação', async ({ page, identity }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Fale com a equipe' }).click();
  await page.getByLabel('E-mail', { exact: true }).fill(identity.email);
  await page.getByLabel('Mensagem', { exact: true }).fill('Contato de ' + identity.slug);
  await expect(page.getByRole('status')).not.toHaveText('Mensagem recebida pela equipe.');
  const response = page.waitForResponse(r => r.url().endsWith('/api/contact') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Enviar mensagem' }).click();
  expect((await response).status()).toBe(201);
  await expect(page.getByRole('status')).toHaveText('Mensagem recebida pela equipe.');
});

test('exporta o JSON antes e depois da publicação sem alterar o rascunho', async ({ page, artist }) => {
  await profile(page, artist.name);
  await event(page, 'Ensaio reservado');
  await page.getByRole('link', { name: 'Publicação', exact: true }).click();
  async function downloadPortfolio() {
    const ready = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Exportar meus dados' }).click();
    const file = await ready;
    expect(file.suggestedFilename()).toBe('compasso-dados.json');
    return JSON.parse(await readFile(await file.path(), 'utf8'));
  }
  const before = await downloadPortfolio();
  expect(before.slug).toBe(artist.slug);
  expect(before.profile.name).toBe(artist.name);
  expect(before.events.map(item => item.title)).toEqual(['Ensaio reservado']);
  expect(before.publication).toBeNull();
  await publish(page);
  const after = await downloadPortfolio();
  expect(after.events).toEqual(before.events);
  expect(after.publication.events).toEqual([]);
  expect(after.publication.profile).toEqual(before.profile);
  await expect(page.getByText('Sem alterações pendentes.')).toBeVisible();
});
