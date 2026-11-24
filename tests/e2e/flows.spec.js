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
  await page.getByLabel('Título', { exact: true }).fill('Gravação ' + artist.name);
  await page.getByLabel('Link do trabalho').fill('https://example.com/gravacao');
  await page.getByRole('button', { name: 'Salvar trabalho' }).click();
  await expect(page.getByRole('heading', { name: 'Gravação ' + artist.name })).toBeVisible();
  await page.getByRole('link', { name: 'Prévia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gravação ' + artist.name })).toBeVisible();
});

test('36/44 · home separa público e músico, teclado e tela estreita', async ({ page, identity }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Explorar', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cadastrar', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Explorar', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Explorar', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Catálogo de demonstração' })).toBeVisible();
  await page.getByLabel('Nome, cidade ou instrumento').fill('sem-resultado-' + Date.now());
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Filtrar por instrumento')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Descubra artistas' })).toBeVisible();
  await register(page, identity);
  await page.getByRole('link', { name: 'Agenda', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Agenda', exact: true })).toBeVisible();
  await page.getByLabel('Título', { exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Data', { exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('34 · editar rascunho mantém a versão vista pelo visitante', async ({ page, artist, visitor }) => {
  await profile(page, artist.name);
  await publish(page);
  await profile(page, 'Nome ainda privado');
  await visitor.goto('http://127.0.0.1:4183/' + artist.slug);
  await expect(visitor.getByRole('heading', { name: artist.name, exact: true })).toBeVisible();
  await expect(visitor.getByText('Nome ainda privado', { exact: true })).toHaveCount(0);
});

test('40 · retirada remove músico da busca e do endereço direto', async ({ page, artist, visitor }) => {
  await profile(page, artist.name);
  await publish(page);
  await visitor.goto('http://127.0.0.1:4183/explorar');
  await visitor.getByLabel('Nome, cidade ou instrumento').fill(artist.name);
  await visitor.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(visitor.getByRole('link', { name: artist.name, exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Retirar publicação' }).click();
  await expect(page.getByText('Portfólio ainda não publicado.')).toBeVisible();
  await visitor.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(visitor.getByText('Nenhum músico encontrado.')).toBeVisible();
  expect((await visitor.goto('http://127.0.0.1:4183/' + artist.slug)).status()).toBe(404);
  await expect(visitor.getByText('Portfólio não encontrado.')).toBeVisible();
});

test('40 · acesso direto, republicação e privacidade da agenda', async ({ page, artist, visitor }) => {
  await profile(page, artist.name);
  await event(page, 'Ensaio privado');
  await event(page, 'Concerto público', 'public');
  await publish(page);
  expect((await visitor.goto('http://127.0.0.1:4183/' + artist.slug)).status()).toBe(200);
  await expect(visitor.getByRole('heading', { name: 'Concerto público' })).toBeVisible();
  await expect(visitor.getByText('Ensaio privado', { exact: true })).toHaveCount(0);
  await expect(visitor.getByRole('link', { name: 'Instagram', exact: true })).toHaveAttribute('href', 'https://www.instagram.com/davi/');
  await page.getByRole('link', { name: 'Agenda', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Concerto público', exact: true }).click();
  await page.getByLabel('Visibilidade').selectOption('private');
  await page.getByRole('button', { name: 'Salvar apresentação' }).click();
  await expect(page.getByRole('heading', { name: 'Concerto público' })).toBeVisible();
  await visitor.reload();
  await expect(visitor.getByRole('heading', { name: 'Concerto público' })).toBeVisible();
  await publish(page);
  await visitor.reload();
  await expect(visitor.getByText('Nenhuma apresentação encontrada.')).toBeVisible();
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
