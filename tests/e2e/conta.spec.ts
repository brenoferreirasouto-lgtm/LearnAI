import { chromium, expect, test, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { openFresh, readProgress, signUp } from './helpers'

const uniqueEmail = (prefix: string) => `${prefix}-${randomUUID()}@example.com`

test.describe('F15 — Cadastro de usuário', () => {
  test.beforeEach(async ({ page }) => openFresh(page))

  test('cria a conta no servidor e mantém os dados após recarregar', async ({ page }) => {
    const email = uniqueEmail('ana-cadastro')
    await signUp(page, 'Ana', email)

    const saved = await readProgress(page)
    expect(saved.profileName).toBe('Ana')
    expect(saved.profileEmail).toBe(email)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seu perfil' })).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
  })

  test('recusa e-mail inválido', async ({ page }) => {
    await page.getByLabel('Como podemos chamar você?').fill('Ana')
    await page.getByLabel('E-mail').fill('email-invalido')
    await page.getByRole('button', { name: 'Criar meu espaço' }).click()

    await expect(page.getByRole('heading', { name: 'Comece por aqui' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Olá, Ana.' })).toHaveCount(0)
  })

  test('recusa e-mail duplicado no mesmo dispositivo', async ({ page }) => {
    const email = uniqueEmail('ana-duplicado')
    await signUp(page, 'Ana', email)

    await page.getByRole('button', { name: /Ana Perfil neste dispositivo/ }).click()
    await page.getByRole('button', { name: 'Sair do perfil neste dispositivo' }).click()
    // Espera a saída terminar no servidor antes de pedir um novo cadastro.
    await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible()
    await page
      .getByRole('button', { name: 'Criar outro cadastro neste dispositivo' })
      .click()

    await page.getByLabel('Como podemos chamar você?').fill('Outra Ana')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill('senha-teste-123')
    await page.getByRole('button', { name: 'Criar meu espaço' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'E-mail já cadastrado',
    )
  })
})

test('F05 — preserva progressos distintos ao alternar contas e reabrir o navegador', async ({ baseURL, channel }, testInfo) => {
  const emailA = uniqueEmail('ana-f05')
  const emailB = uniqueEmail('bruno-f05')
  const profile = testInfo.outputPath('perfil-navegador')
  const launch = () => chromium.launchPersistentContext(profile, {
    baseURL, channel, locale: 'pt-BR', reducedMotion: 'reduce',
  })

  async function signOut(page: Page, name: string) {
    await page.getByRole('button', { name: new RegExp(name + ' Perfil neste dispositivo') }).click()
    await page.getByRole('button', { name: 'Sair do perfil neste dispositivo' }).click()
    await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible()
  }

  async function signIn(page: Page, email: string) {
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill('senha-teste-123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('heading', { name: 'Seu perfil' })).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
  }

  async function completeLesson(page: Page, index: number) {
    await page.getByRole('button', { name: 'Trilha de aprendizagem' }).first().click()
    await page.getByRole('button', { name: /Estudar módulo/ }).nth(index).click()
    await page.getByRole('button', { name: /Concluir módulo/ }).click()
    await page.getByRole('button', { name: /Voltar à trilha/ }).click()
    await expect(page.getByRole('button', { name: 'Revisar aula' })).toHaveCount(1)
  }

  async function expectCompletedLesson(page: Page, lesson: string) {
    expect((await readProgress(page)).completedLessons).toEqual([lesson])
    await page.getByRole('button', { name: 'Trilha de aprendizagem' }).first().click()
    await expect(page.getByRole('button', { name: 'Revisar aula' })).toHaveCount(1)
  }

  const initial = await launch()
  let lessonB: string
  try {
    const page = initial.pages()[0]
    await openFresh(page)
    await signUp(page, 'Ana', emailA)
    await completeLesson(page, 0)
    expect((await readProgress(page)).completedLessons).toEqual(['generative-ai'])
    await signOut(page, 'Ana')

    await page.getByRole('button', { name: 'Criar outro cadastro neste dispositivo' }).click()
    await signUp(page, 'Bruno', emailB)
    expect((await readProgress(page)).completedLessons).toEqual([])
    await completeLesson(page, 1)
    const savedB = await readProgress(page)
    expect(savedB.completedLessons).toHaveLength(1)
    lessonB = savedB.completedLessons[0]
    expect(lessonB).not.toBe('generative-ai')
    await signOut(page, 'Bruno')

    await signIn(page, emailA)
    await expectCompletedLesson(page, 'generative-ai')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seu perfil' })).toBeVisible()
    await expectCompletedLesson(page, 'generative-ai')
    await signOut(page, 'Ana')
  } finally {
    await initial.close()
  }

  const reopened = await launch()
  try {
    const page = reopened.pages()[0]
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Comece por aqui' })).toBeVisible()
    await page.getByRole('button', { name: 'Já tenho conta' }).click()
    await signIn(page, emailB)
    await expectCompletedLesson(page, lessonB)
  } finally {
    await reopened.close()
  }
})
