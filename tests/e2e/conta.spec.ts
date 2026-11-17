import { expect, test } from '@playwright/test'
import { openFresh, readProgress, signUp } from './helpers'

test.describe('F15 — Cadastro de usuário', () => {
  test.beforeEach(async ({ page }) => openFresh(page))

  test('cria a conta local e mantém os dados após recarregar', async ({ page }) => {
    await signUp(page, 'Ana', 'ana@example.com')

    const saved = await readProgress(page)
    expect(saved.profileName).toBe('Ana')
    expect(saved.profileEmail).toBe('ana@example.com')

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Olá, Ana.' })).toBeVisible()
  })

  test('recusa e-mail inválido', async ({ page }) => {
    await page.getByLabel('Como podemos chamar você?').fill('Ana')
    await page.getByLabel('E-mail').fill('email-invalido')
    await page.getByRole('button', { name: 'Criar meu espaço' }).click()

    await expect(page.getByRole('heading', { name: 'Comece por aqui' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Olá, Ana.' })).toHaveCount(0)
  })

  test('recusa e-mail duplicado no mesmo dispositivo', async ({ page }) => {
    await signUp(page, 'Ana', 'ana@example.com')

    await page.getByRole('button', { name: /Ana Perfil neste dispositivo/ }).click()
    await page.getByRole('button', { name: 'Sair do perfil neste dispositivo' }).click()
    await page
      .getByRole('button', { name: 'Criar outro cadastro neste dispositivo' })
      .click()

    await page.getByLabel('Como podemos chamar você?').fill('Outra Ana')
    await page.getByLabel('E-mail').fill('ana@example.com')
    await page.getByRole('button', { name: 'Criar meu espaço' }).click()

    await expect(page.getByRole('alert')).toContainText(
      'Este e-mail já está cadastrado neste dispositivo.',
    )
  })
})

test.describe('F05 — Continuar de onde parou', () => {
  test('sai do perfil e retorna sem perder o progresso', async ({ page }) => {
    await openFresh(page)
    await signUp(page, 'Ana', 'ana@example.com')

    await page.getByRole('button', { name: 'Trilha de aprendizagem' }).first().click()
    await page.getByRole('button', { name: /Estudar módulo/ }).first().click()
    await page.getByRole('button', { name: /Concluir módulo/ }).click()
    await page.getByRole('button', { name: /Voltar à trilha/ }).click()

    await page.getByRole('button', { name: /Ana Perfil neste dispositivo/ }).click()
    await page.getByRole('button', { name: 'Sair do perfil neste dispositivo' }).click()
    await expect(
      page.getByRole('heading', { name: 'Continue seu percurso' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Continuar meu percurso' }).click()
    await expect(page.getByRole('heading', { name: 'Olá, Ana.' })).toBeVisible()

    const saved = await readProgress(page)
    expect(saved.completedLessons).toContain('generative-ai')
  })
})
