import { describe, expect, it } from "vitest"
import { lessons, quizzes } from "../data/course"
import type { QuizResult } from "./progress"
import { quizToLesson, recommendNextLesson, type RecommendationInput } from "./recommendations"

function quizResult(completedAt: string, incorrectTopics: string[] = []): QuizResult {
  return { score: 3 - incorrectTopics.length, total: 3, completedAt, incorrectTopics }
}

function input(change: Partial<RecommendationInput> = {}): RecommendationInput {
  return { quizResults: {}, completedLessons: [], level: null, ...change }
}

describe("recommendNextLesson (F11)", () => {
  it("sem nível nem quizzes, começa pela introdução", () => {
    expect(recommendNextLesson(input()).id).toBe("generative-ai")
  })

  it("usa o módulo sugerido para o nível do nivelamento", () => {
    expect(recommendNextLesson(input({ level: "Intermediário" })).id).toBe("prompting")
    expect(recommendNextLesson(input({ level: "Avançado" })).id).toBe("verification")
  })

  it("com erro recente em um quiz, aponta o módulo de revisão do tema", () => {
    const recommendation = recommendNextLesson(
      input({
        level: "Avançado",
        quizResults: { hallucinations: quizResult("2026-11-20T10:00:00.000Z", ["Checagem de fontes"]) },
      }),
    )
    expect(recommendation.id).toBe("limitations")
  })

  it("considera o quiz mais recente que teve erros", () => {
    const quizResults = {
      privacy: quizResult("2026-11-19T10:00:00.000Z", ["Dados pessoais"]),
      hallucinations: quizResult("2026-11-20T10:00:00.000Z", ["Checagem de fontes"]),
      foundations: quizResult("2026-11-21T10:00:00.000Z"),
    }
    expect(recommendNextLesson(input({ quizResults })).id).toBe("limitations")
  })

  it("com a revisão já concluída, volta para a sugestão do nível", () => {
    const recommendation = recommendNextLesson(
      input({
        level: "Intermediário",
        completedLessons: ["limitations"],
        quizResults: { hallucinations: quizResult("2026-11-20T10:00:00.000Z", ["Checagem de fontes"]) },
      }),
    )
    expect(recommendation.id).toBe("prompting")
  })

  it("com o módulo do nível concluído, sugere o primeiro módulo pendente da trilha", () => {
    const recommendation = recommendNextLesson(
      input({ level: "Iniciante", completedLessons: ["generative-ai"] }),
    )
    expect(recommendation.id).toBe(lessons.find((lesson) => lesson.id !== "generative-ai")!.id)
  })

  it("com a trilha toda concluída, volta ao primeiro módulo", () => {
    const recommendation = recommendNextLesson(
      input({ level: "Avançado", completedLessons: lessons.map((lesson) => lesson.id) }),
    )
    expect(recommendation.id).toBe(lessons[0].id)
  })

  it("todo quiz da trilha aponta para um módulo existente", () => {
    const lessonIds = new Set(lessons.map((lesson) => lesson.id))
    for (const quizId of Object.keys(quizzes)) {
      expect(lessonIds.has(quizToLesson[quizId]), quizId).toBe(true)
    }
  })
})
