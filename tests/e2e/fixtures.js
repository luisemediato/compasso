import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export const test = base.extend({
  identity: async ({}, use) => {
    const slug = 'musico-' + randomUUID();
    await use({ name: 'Artista ' + slug.slice(-8), slug, email: slug + '@example.com', password: 'Senha123!' });
  },
  artist: async ({ page, identity }, use) => {
    await register(page, identity);
    await use(identity);
  },
  visitor: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(await context.newPage());
    await context.close();
  },
});
export { expect };

export async function register(page, identity) {
  await page.goto('/cadastro');
  await page.getByLabel('Nome completo').fill('Pessoa de Teste');
  await page.getByLabel('Nome artístico', { exact: true }).fill(identity.name);
  await page.getByLabel('Endereço do portfólio').fill(identity.slug);
  await page.getByLabel('E-mail', { exact: true }).fill(identity.email);
  await page.getByLabel('Senha', { exact: true }).fill(identity.password);
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(page).toHaveURL(/\/painel$/);
}

export async function profile(page, name) {
  await page.getByRole('link', { name: 'Perfil', exact: true }).click();
  if (name) await page.getByLabel('Nome artístico', { exact: true }).fill(name);
  await page.getByLabel('Instrumento', { exact: true }).fill('Viola');
  await page.getByLabel('Instagram (usuário ou link)').fill('@davi');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toHaveText('Perfil salvo.');
}

export async function event(page, title = 'Concerto de teste', visibility = 'private', options = {}) {
  const { date = '2030-06-15', time = '19:30', description, ticket } = options;
  await page.getByRole('link', { name: 'Agenda', exact: true }).click();
  await page.getByRole('button', { name: 'Nova apresentação', exact: true }).click();
  await page.getByLabel('Título', { exact: true }).fill(title);
  await page.getByLabel('Data', { exact: true }).fill(date);
  await page.getByLabel('Horário').fill(time);
  await page.getByLabel('Local', { exact: true }).fill('Sala de recital');
  if (description) await page.getByLabel('Descrição').fill(description);
  if (ticket) await page.getByLabel('Link do ingresso').fill(ticket);
  await page.getByLabel('Visibilidade').selectOption(visibility);
  await page.getByRole('button', { name: 'Salvar apresentação' }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}

export async function publish(page) {
  await page.getByRole('link', { name: 'Publicação', exact: true }).click();
  await page.getByRole('button', { name: /^(Publicar|Republicar)$/ }).click();
  await expect(page.getByText('Sem alterações pendentes.')).toBeVisible();
}
