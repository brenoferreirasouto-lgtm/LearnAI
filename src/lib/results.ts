export type ActivityScore = {
  score: number
  total: number
}

export type ResultEntry = {
  id: string
  kind: "quiz" | "practice"
  score: number
  total: number
  percentage: number
}

export type OverallResult = {
  correct: number
  total: number
  percentage: number
  activitiesCompleted: number
  entries: ResultEntry[]
}

/**
 * Consolidates the latest saved quiz result and the best saved practice result
 * for each activity. The overall percentage is weighted by the number of
 * evaluated items, rather than averaging activity percentages equally.
 */
export function calculateOverallResult(
  quizResults: Record<string, ActivityScore>,
  practiceResults: Record<string, ActivityScore>,
): OverallResult {
  const entries: ResultEntry[] = []

  const addEntries = (
    records: Record<string, ActivityScore>,
    kind: ResultEntry["kind"],
  ) => {
    for (const [id, result] of Object.entries(records)) {
      if (
        !result ||
        typeof result.score !== "number" ||
        !Number.isFinite(result.score) ||
        typeof result.total !== "number" ||
        !Number.isFinite(result.total) ||
        result.total <= 0
      ) {
        continue
      }

      const total = result.total
      const score = Math.max(0, Math.min(total, result.score))
      entries.push({
        id,
        kind,
        score,
        total,
        percentage: Math.round((score / total) * 100),
      })
    }
  }

  addEntries(quizResults, "quiz")
  addEntries(practiceResults, "practice")

  const correct = entries.reduce((sum, entry) => sum + entry.score, 0)
  const total = entries.reduce((sum, entry) => sum + entry.total, 0)

  return {
    correct,
    total,
    percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    activitiesCompleted: entries.length,
    entries,
  }
}
