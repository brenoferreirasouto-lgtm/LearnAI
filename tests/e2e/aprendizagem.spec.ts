import { expect, test } from '@playwright/test'
import { openFresh, readProgress, signUp } from './helpers'

test.beforeEach(async ({ page }) => {
  await openFresh(page)
  await signUp(page)
})

test('F01/F09 — estuda o primeiro módulo e o dashboard é atualizado', async ({ page }) => {
  await page.getByRole('button', { name: 'Trilha de aprendizagem' }).first().click()
  await page.getByRole('button', { name: /Estudar módulo/ }).first().click()

  await expect(
    page.getByRole('heading', { name: 'IA generativa sem mistério' }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Concluir módulo/ }).click()

  await page.getByRole('button', { name: /Voltar à trilha/ }).click()
  await page.getByRole('button', { name: 'Visão geral' }).first().click()

  await expect(page.getByText(/1 de \d+ módulos/).first()).toBeVisible()
  const saved = await readProgress(page)
  expect(saved.completedLessons).toContain('generative-ai')
  expect(saved.xp).toBe(25)
})

test('F06 — monta um prompt guiado a partir dos campos', async ({ page }) => {
  await page.getByRole('button', { name: 'Construtor de prompts' }).first().click()
  await expect(
    page.getByRole('heading', { name: 'Construa sua instrução' }),
  ).toBeVisible()

  await page.locator('#prompt-context').fill('Vou apresentar um seminário de biologia')
  await page.locator('#prompt-goal').fill('Organizar os tópicos em sequência')
  await page.locator('#prompt-audience').fill('Colegas do primeiro semestre')
  await page.locator('#prompt-format').fill('Roteiro de 6 slides')
  await page.getByRole('button', { name: 'Montar meu prompt' }).click()

  const result = page.getByLabel('Prompt estruturado editável')
  await expect(result).toBeVisible()
  await expect(result).toHaveValue(/Organizar os tópicos em sequência/)
  await expect(result).toHaveValue(/Roteiro de 6 slides/)
})

test('F07 — compara três pares de prompts e registra o resultado', async ({ page }) => {
  await page.getByRole('button', { name: /Compare prompts/ }).first().click()

  const correctOptions = ['B', 'A', 'B']
  for (const [index, option] of correctOptions.entries()) {
    await page.getByRole('button', { name: new RegExp(`Prompt ${option}`) }).click()
    await page.getByRole('button', { name: 'Conferir escolha' }).click()
    await expect(page.getByText('Boa comparação')).toBeVisible()
    await page
      .getByRole('button', {
        name: index === correctOptions.length - 1 ? 'Ver resultado' : 'Próximo desafio',
      })
      .click()
  }

  await expect(page.getByText('3 de 3 comparações corretas')).toBeVisible()
  const saved = await readProgress(page)
  expect(saved.practiceResults['compare-study-plan'].score).toBe(1)
  expect(saved.xp).toBe(15)
})

test('F08/F13 — avalia o checklist de verificação e mostra feedback', async ({ page }) => {
  await page.getByRole('button', { name: /Verifique uma resposta de IA/ }).first().click()

  await page.getByLabel(/O texto identifica a base que sustenta o dado/).check()
  await page.getByLabel(/A data da coleta está indicada/).check()
  await page.getByLabel(/A proporção de 18 participantes/).check()
  await page.getByRole('button', { name: 'Avaliar checklist' }).click()

  await expect(
    page.getByText('4 de 4 critérios identificados corretamente'),
  ).toBeVisible()
  const saved = await readProgress(page)
  expect(saved.practiceResults['verify-frequency-claim'].score).toBe(4)
})

test('F10 — exibe o resultado final consolidado', async ({ page }) => {
  // Sem atividades, o resultado ainda não foi construído.
  await page.getByRole('button', { name: 'Ver resultado final' }).first().click()
  await expect(
    page.getByRole('heading', { name: 'Seu resultado ainda está sendo construído' }),
  ).toBeVisible()

  // Após uma prática, o resumo consolidado aparece.
  await page.getByRole('button', { name: 'Voltar ao painel' }).click()
  await page.getByRole('button', { name: /Verifique uma resposta de IA/ }).first().click()
  await page.getByLabel(/O texto identifica a base que sustenta o dado/).check()
  await page.getByRole('button', { name: 'Avaliar checklist' }).click()
  await expect(page.getByText(/critérios identificados corretamente/)).toBeVisible()

  await page.getByRole('button', { name: 'Visão geral' }).first().click()
  await page.getByRole('button', { name: 'Ver resultado final' }).first().click()
  await expect(
    page.getByRole('heading', { name: 'Seu resultado final' }),
  ).toBeVisible()
  const summary = page.getByRole('region', { name: 'Resumo do resultado final' })
  // Com apenas um critério marcado, o checklist registra 2 de 4 acertos.
  await expect(summary).toContainText('50%')
  await expect(summary).toContainText('2 / 4')
  await expect(page.getByText('Verificação de informações')).toBeVisible()
})

test('F14 — o menu dá acesso às áreas principais', async ({ page }) => {
  const areas: [string, string][] = [
    ['Trilha de aprendizagem', 'Trilha de aprendizagem'],
    ['Construtor de prompts', 'Construtor de prompts'],
    ['Minha evolução', 'Sua jornada'],
    ['Visão geral', 'Olá, Estudante.'],
  ]
  for (const [menu, heading] of areas) {
    await page.getByRole('button', { name: menu }).first().click()
    await expect(
      page.getByRole('heading', { name: heading, exact: true }).first(),
    ).toBeVisible()
  }
})
