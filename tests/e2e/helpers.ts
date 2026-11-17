import { expect, type Page } from '@playwright/test'

/** Abre o app com o armazenamento local limpo. */
export async function openFresh(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Comece por aqui' }),
  ).toBeVisible()
}

/** F15 — cria o cadastro local e chega ao painel inicial. */
export async function signUp(
  page: Page,
  name = 'Estudante',
  email = 'estudante@example.com',
) {
  await page.getByLabel('Como podemos chamar você?').fill(name)
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Criar meu espaço' }).click()
  await expect(
    page.getByRole('heading', { name: `Olá, ${name}.` }),
  ).toBeVisible()
}

export async function readProgress(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem('learnai.progress.v1') ?? 'null'),
  )
}
