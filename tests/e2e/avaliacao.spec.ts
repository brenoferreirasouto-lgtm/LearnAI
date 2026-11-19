import { expect, test, type Page } from '@playwright/test'
import { lessons, placementQuestions, quizzes } from '../../src/data/course'
import { openFresh, readProgress, signUp } from './helpers'

test.beforeEach(async ({ page }) => {
  await openFresh(page)
  await signUp(page)
})

const lessonTitle = (id: string) => lessons.find((lesson) => lesson.id === id)!.title

/** Responde o nivelamento acertando as `correct` primeiras questões e errando as demais. */
async function answerPlacement(page: Page, correct: number) {
  await page.getByRole('button', { name: /Fazer avaliação/ }).click()
  await page.getByRole('button', { name: 'Iniciar avaliação' }).click()
  for (const [index, question] of placementQuestions.entries()) {
    const choice = index < correct ? question.answer : (question.answer + 1) % question.options.length
    await page.getByRole('button', { name: question.options[choice] }).click()
    await page
      .getByRole('button', { name: index === placementQuestions.length - 1 ? 'Ver resultado' : 'Próxima' })
      .click()
  }
}

test('F02 — o nivelamento calcula o nível pelas respostas e o painel o registra', async ({ page }) => {
  await answerPlacement(page, 3)

  await expect(page.getByRole('heading', { name: 'Nível Intermediário' })).toBeVisible()
  await expect(page.getByText('Você acertou 3 de 6 questões')).toBeVisible()

  await page.getByRole('button', { name: 'Começar minha trilha' }).click()
  await expect(page.getByRole('heading', { name: 'Faça uma avaliação rápida' })).toHaveCount(0)
  const saved = await readProgress(page)
  expect(saved.level).toBe('Intermediário')
  expect(saved.placementScore).toBe(3)
})

test('F03 — o nível define o módulo sugerido para começar', async ({ page }) => {
  await answerPlacement(page, placementQuestions.length)

  await expect(page.getByRole('heading', { name: 'Nível Avançado' })).toBeVisible()
  await expect(page.locator('.recommendation-box')).toContainText(lessonTitle('verification'))

  await page.getByRole('button', { name: 'Começar minha trilha' }).click()
  await expect(page.locator('.next-lesson')).toContainText(lessonTitle('verification'))
  await page.getByRole('button', { name: /Retomar aprendizagem/ }).click()
  await expect(page.getByRole('heading', { name: lessonTitle('verification') })).toBeVisible()
})

test('F04 — o quiz de alucinações explica o erro e confirma o acerto', async ({ page }) => {
  const [first, second] = quizzes.hallucinations.questions
  await page.getByRole('button', { name: /Detecte alucinações/ }).first().click()

  const wrong = (first.answer + 1) % first.options.length
  await page.getByRole('button', { name: first.options[wrong] }).click()
  await page.getByRole('button', { name: 'Conferir resposta' }).click()
  const feedback = page.locator('.answer-feedback')
  await expect(feedback).toContainText('Vamos entender melhor')
  await expect(feedback).toContainText(first.explanations[wrong])

  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: second.options[second.answer] }).click()
  await page.getByRole('button', { name: 'Conferir resposta' }).click()
  await expect(feedback).toContainText('Resposta correta')
  await expect(feedback).toContainText(second.explanations[second.answer])
})

test('F12 — o quiz do módulo mostra os acertos e os temas para revisar', async ({ page }) => {
  const firstLesson = lessons[0]
  const quiz = quizzes[firstLesson.quizId]
  await page.getByRole('button', { name: 'Trilha de aprendizagem' }).first().click()
  await page.getByRole('button', { name: /Estudar módulo/ }).first().click()
  await expect(page.getByRole('heading', { name: firstLesson.title })).toBeVisible()
  await page.getByRole('button', { name: /Fazer atividade/ }).click()

  // Erra só a primeira questão.
  for (const [index, question] of quiz.questions.entries()) {
    const choice = index === 0 ? (question.answer + 1) % question.options.length : question.answer
    await page.getByRole('button', { name: question.options[choice] }).click()
    await page.getByRole('button', { name: 'Conferir resposta' }).click()
    await page
      .getByRole('button', { name: index === quiz.questions.length - 1 ? 'Ver resultado' : 'Continuar' })
      .click()
  }

  const total = quiz.questions.length
  await expect(page.getByText(`${total - 1} de ${total}`)).toBeVisible()
  const review = page.locator('.review-topics')
  await expect(review).toContainText('Temas para revisitar')
  await expect(review).toContainText(quiz.questions[0].topic)
  const saved = await readProgress(page)
  expect(saved.quizResults[firstLesson.quizId].score).toBe(total - 1)
  expect(saved.quizResults[firstLesson.quizId].incorrectTopics).toEqual([quiz.questions[0].topic])
})
