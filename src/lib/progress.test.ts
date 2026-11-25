
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  accountProgressKey,
  claimXp,
  createEmptyProgress,
  readAccountProgress,
  readProgress,
  saveAccountProgress,
  saveProgress,
  storageKey,
} from './progress'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('createEmptyProgress', () => {
  it('deve criar um progresso inicial vazio', () => {
    const progress = createEmptyProgress()

    expect(progress.version).toBe(1)
    expect(progress.profileName).toBe('')
    expect(progress.level).toBeNull()
    expect(progress.xp).toBe(0)
    expect(progress.completedLessons).toEqual([])
    expect(progress.projects).toEqual([])
    expect(progress.rewardClaims).toEqual([])
    expect(progress.promptDraft.context).toBe('')
  })
})

describe('readProgress', () => {
  it('deve retornar progresso vazio quando não existem dados salvos', () => {
    expect(readProgress()).toEqual(createEmptyProgress())
  })

  it('deve retornar progresso vazio quando o JSON está corrompido', () => {
    localStorage.setItem(storageKey, '{json inválido')

    expect(readProgress()).toEqual(createEmptyProgress())
  })

  it('deve rejeitar versões incompatíveis', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ version: 2 }),
    )

    expect(readProgress()).toEqual(createEmptyProgress())
  })
  it('deve preservar os campos válidos do progresso', () => {
    const saved = {
      version: 1,
      profileName: 'Bruno',
      level: 'intermediário',
      placementScore: 8,
      xp: 120,
      completedLessons: ['lesson-1'],
      reflections: {
        'lesson-1': 'Aprendi sobre inteligência artificial',
      },
      quizResults: {
        'quiz-1': {
          score: 4,
          total: 5,
          completedAt: '2026-11-10',
          incorrectTopics: [],
        },
      },
      practiceResults: {
        'practice-1': {
          score: 2,
          total: 2,
          completedAt: '2026-11-10',
          correctIds: ['question-1'],
        },
      },
      rewardClaims: ['lesson-1'],
      projects: [
        {
          id: 'project-1',
          title: 'Projeto válido',
          idea: 'Criar uma solução educacional',
          objective: 'Facilitar a aprendizagem',
          createdAt: '2026-11-10',
          notes: '',
          steps: [
            {
              id: 'step-1',
              title: 'Primeira etapa',
              guide: 'Defina o problema',
              complete: false,
            },
          ],
        },
      ],
      lastLessonId: 'lesson-1',
      promptDraft: {
        context: 'Educação',
        goal: 'Criar uma solução',
        audience: 'Profissionais',
        inputs: 'Dados de aprendizagem',
        format: 'Projeto',
        constraints: 'Preservar autoria',
        result: 'Protótipo funcional',
      },
    }

    localStorage.setItem(storageKey, JSON.stringify(saved))

    const progress = readProgress()

    expect(progress.profileName).toBe('Bruno')
    expect(progress.level).toBe('intermediário')
    expect(progress.placementScore).toBe(8)
    expect(progress.xp).toBe(120)
    expect(progress.reflections).toEqual(saved.reflections)
    expect(progress.quizResults).toEqual(saved.quizResults)
    expect(progress.practiceResults['practice-1']).toEqual(
      saved.practiceResults['practice-1'],
    )
    expect(progress.rewardClaims).toEqual(['lesson-1'])
    expect(progress.projects).toHaveLength(1)
    expect(progress.lastLessonId).toBe('lesson-1')
    expect(progress.promptDraft).toEqual(saved.promptDraft)
  })

  it('deve normalizar dados inválidos e limitar informações', () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        profileName: 'A'.repeat(70),
        xp: -10,
        completedLessons: ['lesson-1', 123],
        rewardClaims: ['quiz-1', 456],
        projects: [
          {
            id: 'project-1',
            title: 'Projeto válido',
            idea: 'Criar uma solução educacional',
            objective: 'Facilitar a aprendizagem',
            createdAt: '2026-11-10',
            notes: '',
            steps: [],
          },
          null,
          { id: 42, title: 'ID inválido', steps: [] },
          { id: 'project-2', title: 7, steps: [] },
          { id: 'project-3', title: 'Etapas inválidas', steps: 'inválido' },
        ],

        practiceResults: {
          valid: {
            score: 8,
            total: 5,
            completedAt: '2026-11-09',
            correctIds: ['question-1', 123],
          },
          invalid: {
            score: 2,
            total: 0,
            completedAt: '2026-11-09',
            correctIds: [],
          },
        },
        promptDraft: {
          context: 'Aprendizagem com IA',
          goal: 123,
        },
      }),
    )

    const progress = readProgress()
    expect(progress.rewardClaims).toEqual(['quiz-1'])

    expect(progress.projects).toHaveLength(1)
    expect(progress.projects[0]).toMatchObject({
      id: 'project-1',
      title: 'Projeto válido',
      steps: [],
    })

    expect(progress.profileName).toHaveLength(60)
    expect(progress.xp).toBe(0)
    expect(progress.completedLessons).toEqual(['lesson-1'])

    expect(progress.practiceResults.valid.score).toBe(5)
    expect(progress.practiceResults.valid.correctIds).toEqual([
  'question-1',
])

    expect(progress.practiceResults.invalid).toBeUndefined()

    expect(progress.promptDraft.context).toBe('Aprendizagem com IA')
    expect(progress.promptDraft.goal).toBe('')
  })
})

describe('saveProgress', () => {
  it('deve salvar o progresso quando existe atividade', () => {
    const progress = createEmptyProgress()
    progress.profileName = 'Bruno'
    progress.xp = 25

    expect(saveProgress(progress)).toBe(true)

    const saved = JSON.parse(
      localStorage.getItem(storageKey) ?? 'null',
    )

    expect(saved.profileName).toBe('Bruno')
    expect(saved.xp).toBe(25)
  })

  it('deve remover os dados quando o progresso está vazio', () => {
    localStorage.setItem(storageKey, 'dados anteriores')

    const progress = createEmptyProgress()

    expect(saveProgress(progress)).toBe(true)
    expect(localStorage.getItem(storageKey)).toBeNull()
  })

  it('deve retornar false quando o armazenamento falha', () => {
    const progress = createEmptyProgress()
    progress.profileName = 'Bruno'

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Armazenamento indisponível')
    })

    expect(saveProgress(progress)).toBe(false)
  })
})

describe('claimXp', () => {
  it('deve adicionar XP e registrar a recompensa', () => {
    const progress = createEmptyProgress()

    const updated = claimXp(progress, 'lesson-1', 50)

    expect(updated.xp).toBe(50)
    expect(updated.rewardClaims).toContain('lesson-1')
  })

  it('não deve conceder XP duas vezes pela mesma recompensa', () => {
    const progress = createEmptyProgress()

    const firstClaim = claimXp(progress, 'lesson-1', 50)
    const secondClaim = claimXp(firstClaim, 'lesson-1', 50)

    expect(secondClaim.xp).toBe(50)
    expect(secondClaim.rewardClaims).toEqual(['lesson-1'])
    expect(secondClaim).toBe(firstClaim)
  })
})

describe('progresso por conta', () => {
  const ana = { id: 1, email: 'ana@example.com' }
  const bruno = { id: 2, email: 'bruno@example.com' }

  it('migra o legado somente para a conta com o e-mail correspondente', () => {
    const legacy = { ...createEmptyProgress(), profileEmail: ana.email, xp: 25 }
    expect(saveProgress(legacy)).toBe(true)

    expect(readAccountProgress(bruno).xp).toBe(0)
    const brunoProgress = { ...createEmptyProgress(), profileEmail: bruno.email, xp: 50 }
    expect(saveAccountProgress(bruno, brunoProgress)).toBe(true)
    expect(readProgress()).toEqual(legacy)

    const recovered = readAccountProgress(ana)
    expect(recovered).toEqual(legacy)
    expect(saveAccountProgress(ana, recovered)).toBe(true)
    expect(localStorage.getItem(storageKey)).toBeNull()
    expect(readAccountProgress(ana)).toEqual(legacy)
    expect(readAccountProgress(bruno)).toEqual(brunoProgress)
    expect(readAccountProgress({ ...ana, email: 'novo@example.com' })).toEqual(legacy)
  })

  it('mantém intacto o legado sem titular mesmo depois do primeiro salvamento', () => {
    const legacy = { ...createEmptyProgress(), xp: 25 }
    expect(saveProgress(legacy)).toBe(true)
    expect(readAccountProgress(ana)).toEqual(createEmptyProgress())
    expect(saveAccountProgress(ana, { ...createEmptyProgress(), profileEmail: ana.email })).toBe(true)
    expect(readProgress()).toEqual(legacy)
  })

  it('mantém o legado quando a gravação por conta falha', () => {
    const legacy = { ...createEmptyProgress(), profileEmail: ana.email, xp: 25 }
    expect(saveProgress(legacy)).toBe(true)
    const recovered = readAccountProgress(ana)
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Sem espaço disponível')
    })
    expect(saveAccountProgress(ana, recovered)).toBe(false)
    write.mockRestore()
    expect(localStorage.getItem(accountProgressKey(ana.id))).toBeNull()
    expect(readProgress()).toEqual(legacy)
  })

  it('prioriza o progresso por ID e preserva um legado que não foi importado', () => {
    const current = { ...createEmptyProgress(), profileEmail: ana.email, xp: 50 }
    const legacy = { ...current, xp: 25 }
    expect(saveAccountProgress(ana, current)).toBe(true)
    expect(saveProgress(legacy)).toBe(true)
    expect(readAccountProgress(ana)).toEqual(current)
    expect(saveAccountProgress(ana, current)).toBe(true)
    expect(readProgress()).toEqual(legacy)
  })
})
