
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'

import App from './App'
import { accountProgressKey, createEmptyProgress, storageKey, type Progress } from './lib/progress'

const account = { id: 1, nome: 'Bruno', email: 'bruno@example.com' }

function saveAccountProgress(change: (progress: Progress) => void = () => {}) {
  const savedProgress = createEmptyProgress()
  savedProgress.profileName = account.nome
  savedProgress.profileEmail = account.email
  change(savedProgress)
  localStorage.setItem(storageKey, JSON.stringify(savedProgress))
}

function readSavedProgress() {
  return JSON.parse(localStorage.getItem(accountProgressKey(account.id)) ?? 'null')
}

function renderApp(onAccountSignOut = vi.fn()) {
  render(<App account={account} onAccountSignOut={onAccountSignOut} />)
  return onAccountSignOut
}

function openDashboard() {
  fireEvent.click(screen.getByRole('button', { name: 'Visão geral' }))
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('scrollTo', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('deve abrir no perfil da conta, com o e-mail cadastrado', () => {
    renderApp()

    expect(screen.getByRole('heading', { name: 'Seu perfil' })).toBeTruthy()
    expect(screen.getByText(account.email)).toBeTruthy()
  })

  it('deve recuperar o progresso salvo da mesma conta', async () => {
    saveAccountProgress((progress) => {
      progress.xp = 45
    })

    renderApp()
    openDashboard()

    expect(
      screen.getByRole('heading', { name: 'Olá, Bruno.' }),
    ).toBeTruthy()

    await waitFor(() => {
      const saved = readSavedProgress()
      expect(saved.profileEmail).toBe(account.email)
      expect(saved.xp).toBe(45)
    })
  })

  it('deve começar do zero quando o progresso salvo é de outra conta', async () => {
    saveAccountProgress((progress) => {
      progress.profileName = 'Ana'
      progress.profileEmail = 'ana@example.com'
      progress.xp = 80
    })

    renderApp()

    await waitFor(() => {
      const saved = readSavedProgress()
      expect(saved.profileName).toBe(account.nome)
      expect(saved.profileEmail).toBe(account.email)
      expect(saved.xp).toBe(0)
    })
  })

  it('deve encerrar a sessão da conta ao sair do perfil', () => {
    const onAccountSignOut = renderApp()

    fireEvent.click(
      screen.getByRole('button', { name: 'Sair do perfil neste dispositivo' }),
    )

    expect(onAccountSignOut).toHaveBeenCalledTimes(1)
  })

  it('deve comparar três pares de prompts e registrar o resultado da prática', async () => {
    saveAccountProgress()

    renderApp()
    openDashboard()

    fireEvent.click(
      screen.getByRole('button', { name: /Compare prompts/ }),
    )

    const correctOptions = ['B', 'A', 'B'] as const
    for (let index = 0; index < correctOptions.length; index += 1) {
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(`Prompt ${correctOptions[index]}`),
        }),
      )
      fireEvent.click(
        screen.getByRole('button', { name: 'Conferir escolha' }),
      )
      expect(screen.getByText('Boa comparação')).toBeTruthy()
      fireEvent.click(
        screen.getByRole('button', {
          name: index === correctOptions.length - 1
            ? 'Ver resultado'
            : 'Próximo desafio',
        }),
      )
    }

    expect(
      await screen.findByText('3 de 3 comparações corretas'),
    ).toBeTruthy()

    await waitFor(() => {
      const saved = readSavedProgress()
      expect(saved.practiceResults['compare-study-plan'].score).toBe(1)
      expect(saved.practiceResults['compare-source-synthesis'].score).toBe(1)
      expect(saved.practiceResults['compare-project-update'].score).toBe(1)
      expect(saved.xp).toBe(15)
    })
  })

  it('deve avaliar o checklist de verificação e registrar o feedback', async () => {
    saveAccountProgress()

    renderApp()
    openDashboard()

    fireEvent.click(
      screen.getByRole('button', { name: /Verifique uma resposta de IA/ }),
    )

    fireEvent.click(
      screen.getByLabelText(/O texto identifica a base que sustenta o dado/),
    )
    fireEvent.click(
      screen.getByLabelText(/A data da coleta está indicada/),
    )
    fireEvent.click(
      screen.getByLabelText(/A proporção de 18 participantes/),
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Avaliar checklist' }),
    )

    expect(
      await screen.findByText('4 de 4 critérios identificados corretamente'),
    ).toBeTruthy()

    await waitFor(() => {
      const saved = readSavedProgress()
      expect(saved.practiceResults['verify-frequency-claim'].score).toBe(4)
      expect(saved.practiceResults['verify-frequency-claim'].total).toBe(4)
      expect(saved.xp).toBe(12)
    })
  })

  it('deve atualizar o dashboard após a conclusão de um módulo', async () => {
    saveAccountProgress()

    renderApp()

    fireEvent.click(
      screen.getByRole('button', { name: 'Trilha de aprendizagem' }),
    )
    fireEvent.click(
      screen.getAllByRole('button', { name: /Estudar módulo/ })[0],
    )

    expect(
      await screen.findByRole('heading', {
        name: 'IA generativa sem mistério',
      }),
    ).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: /Concluir módulo/ }),
    )

    await waitFor(() => {
      const saved = readSavedProgress()
      expect(saved.completedLessons).toContain('generative-ai')
      expect(saved.xp).toBe(25)
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Voltar à trilha/ }),
    )
    openDashboard()

    expect(screen.getByText(/1 de \d+ módulos/)).toBeTruthy()
    expect(screen.getByText('MÓDULOS CONCLUÍDOS')).toBeTruthy()
  })

  it('deve apresentar o resultado final consolidando quizzes e práticas', async () => {
    saveAccountProgress((progress) => {
      progress.quizResults.hallucinations = {
        score: 2,
        total: 3,
        completedAt: '2026-11-16T12:00:00.000Z',
        incorrectTopics: ['Checagem de fontes'],
      }
      progress.practiceResults['verify-frequency-claim'] = {
        score: 3,
        total: 4,
        completedAt: '2026-11-16T12:05:00.000Z',
        correctIds: ['source', 'date', 'calculation'],
      }
    })

    renderApp()
    openDashboard()

    fireEvent.click(
      screen.getByRole('button', { name: 'Ver resultado final' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Seu resultado final' }),
    ).toBeTruthy()
    expect(screen.getByText('71%')).toBeTruthy()
    const resultSummary = screen.getByRole('region', {
      name: 'Resumo do resultado final',
    })
    expect(resultSummary.textContent).toContain('5 / 7')
    expect(screen.getByText(/Avaliação/)).toBeTruthy()
    expect(screen.getByText('Verificação de informações')).toBeTruthy()
  })
})
