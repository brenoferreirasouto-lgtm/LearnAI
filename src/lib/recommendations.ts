import { lessons, type Lesson } from "../data/course"
import type { Progress } from "./progress"

// F11 — Recomendações de aprendizagem.
// Cada quiz aponta para o módulo que revisa o mesmo tema.
export const quizToLesson: Record<string, string> = {
  foundations: "generative-ai",
  hallucinations: "limitations",
  privacy: "privacy",
  "prompt-comparison": "prompting",
  verification: "verification",
  "responsible-use": "responsible-use",
  "advanced-prompting": "advanced-prompting",
  "research-synthesis": "research-synthesis",
  "professional-writing": "professional-writing",
  "data-analysis": "data-analysis",
  "software-development": "software-development",
  "workflow-automation": "workflow-automation",
  "ai-by-profession": "ai-by-profession",
  "assistants-and-agents": "assistants-and-agents",
  "integrative-project": "integrative-project",
}

// Módulo sugerido para começar em cada nível do nivelamento (F03).
function startingLessonFor(level: Progress["level"]): string {
  if (level === "Avançado") return "verification"
  if (level === "Intermediário") return "prompting"
  return "generative-ai"
}

export type RecommendationInput = Pick<Progress, "quizResults" | "completedLessons" | "level">

/**
 * Escolhe o próximo módulo a recomendar no painel:
 * 1. o módulo de revisão do quiz mais recente com erros, se ainda não foi concluído;
 * 2. senão, o módulo sugerido para o nível, se ainda não foi concluído;
 * 3. senão, o primeiro módulo da trilha ainda não concluído;
 * 4. com a trilha toda concluída, o primeiro módulo.
 */
export function recommendNextLesson(progress: RecommendationInput): Lesson {
  const isPending = (lessonId: string) => !progress.completedLessons.includes(lessonId)

  const latestWithErrors = Object.entries(progress.quizResults)
    .sort((a, b) => b[1].completedAt.localeCompare(a[1].completedAt))
    .find(([, result]) => result.incorrectTopics.length > 0)
  const reviewId = latestWithErrors ? quizToLesson[latestWithErrors[0]] : null
  if (reviewId && isPending(reviewId))
    return lessons.find((lesson) => lesson.id === reviewId) ?? lessons[0]

  const startingId = startingLessonFor(progress.level)
  return (
    lessons.find((lesson) => lesson.id === startingId && isPending(lesson.id)) ??
    lessons.find((lesson) => isPending(lesson.id)) ??
    lessons[0]
  )
}
