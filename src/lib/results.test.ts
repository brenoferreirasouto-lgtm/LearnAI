import { describe, expect, it } from "vitest"
import { calculateOverallResult } from "./results"

describe("calculateOverallResult", () => {
  it("returns an empty result when no activity has been completed", () => {
    expect(calculateOverallResult({}, {})).toEqual({
      correct: 0,
      total: 0,
      percentage: 0,
      activitiesCompleted: 0,
      entries: [],
    })
  })

  it("consolidates quiz and practice scores using a weighted percentage", () => {
    const result = calculateOverallResult(
      {
        hallucinations: { score: 2, total: 3 },
        privacy: { score: 3, total: 3 },
      },
      {
        "verify-frequency-claim": { score: 3, total: 4 },
      },
    )

    expect(result).toMatchObject({
      correct: 8,
      total: 10,
      percentage: 80,
      activitiesCompleted: 3,
    })
    expect(result.entries).toEqual([
      {
        id: "hallucinations",
        kind: "quiz",
        score: 2,
        total: 3,
        percentage: 67,
      },
      {
        id: "privacy",
        kind: "quiz",
        score: 3,
        total: 3,
        percentage: 100,
      },
      {
        id: "verify-frequency-claim",
        kind: "practice",
        score: 3,
        total: 4,
        percentage: 75,
      },
    ])
  })

  it("clamps scores to the valid range and ignores invalid records", () => {
    const result = calculateOverallResult(
      {
        negative: { score: -2, total: 2 },
        aboveMaximum: { score: 8, total: 4 },
        invalidTotal: { score: 1, total: 0 },
        invalidScore: { score: Number.NaN, total: 3 },
      },
      {},
    )

    expect(result).toMatchObject({
      correct: 4,
      total: 6,
      percentage: 67,
      activitiesCompleted: 2,
    })
  })
})
