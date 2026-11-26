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
  email = `estudante-${crypto.randomUUID()}@example.com`,
  password = 'senha-teste-123',
) {
  await page.getByLabel('Como podemos chamar você?').fill(name)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: 'Criar meu espaço' }).click()
  try {
    await expect(page.getByRole('heading', { name: 'Seu perfil' })).toBeVisible()
    await page.getByRole('button', { name: 'Visão geral' }).first().click()
    await expect(page.getByRole('heading', { name: `Olá, ${name}.` })).toBeVisible()
  } catch (error) {
    const alert = page.getByRole('alert')
    const message = await alert.count() ? await alert.first().textContent() : 'nenhuma mensagem de erro visível'
    throw new Error(`Cadastro não concluiu: ${message}\n${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function readProgress(page: Page) {
  const response = await page.request.get('/api/sessao')
  expect(response.ok()).toBe(true)
  const { usuario } = await response.json()
  const key = 'learnai.progress.account.v1.' + usuario.id
  return page.evaluate(storageKey =>
    JSON.parse(localStorage.getItem(storageKey) ?? 'null'), key,
  )
}
