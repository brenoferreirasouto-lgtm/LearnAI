
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
import { createEmptyProgress, storageKey } from './lib/progress'

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

  it('deve exibir a tela de boas-vindas quando não existe perfil local', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: 'Comece por aqui',
      }),
    ).toBeTruthy()

    expect(
      screen.getByLabelText('Como podemos chamar você?'),
    ).toBeTruthy()
  })

  it('deve criar um perfil local e abrir o painel inicial', async () => {
    render(<App />)

    const nameInput = screen.getByLabelText(
      'Como podemos chamar você?',
    )

    fireEvent.change(nameInput, {
      target: { value: 'Bruno' },
    })

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Criar meu espaço',
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Olá, Bruno.',
      }),
    ).toBeTruthy()

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      )

      expect(saved.profileName).toBe('Bruno')
    })
  })

  it('deve permitir sair e retornar ao perfil local sem perder o progresso', async () => {
    const savedProgress = createEmptyProgress()

    savedProgress.profileName = 'Bruno'
    savedProgress.xp = 45

    localStorage.setItem(
      storageKey,
      JSON.stringify(savedProgress),
    )

    render(<App />)

    fireEvent.click(
      screen.getByRole('button', {
        name: /Bruno Perfil neste dispositivo/,
      }),
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Sair do perfil neste dispositivo',
      }),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Continue seu percurso',
      }),
    ).toBeTruthy()

    const nameInput = screen.getByLabelText(
      'Nome de exibição',
    ) as HTMLInputElement

    expect(nameInput.value).toBe('Bruno')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Continuar meu percurso',
      }),
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Olá, Bruno.',
      }),
    ).toBeTruthy()

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      )

      expect(saved.profileName).toBe('Bruno')
      expect(saved.xp).toBe(45)
    })

    expect(
      localStorage.getItem('learnai.session.signed-out.v1'),
    ).toBeNull()
  })

  it('deve recuperar um perfil salvo e abrir o painel inicial', () => {
    const savedProgress = createEmptyProgress()

    savedProgress.profileName = 'Bruno'

    localStorage.setItem(
      storageKey,
      JSON.stringify(savedProgress),
    )

    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: 'Olá, Bruno.',
      }),
    ).toBeTruthy()
  })

  it('deve comparar três pares de prompts e registrar o resultado da prática', async () => {
    const savedProgress = createEmptyProgress()
    savedProgress.profileName = 'Bruno'
    localStorage.setItem(storageKey, JSON.stringify(savedProgress))

    render(<App />)

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
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      )
      expect(saved.practiceResults['compare-study-plan'].score).toBe(1)
      expect(saved.practiceResults['compare-source-synthesis'].score).toBe(1)
      expect(saved.practiceResults['compare-project-update'].score).toBe(1)
      expect(saved.xp).toBe(15)
    })
  })

  it('deve avaliar o checklist de verificação e registrar o feedback', async () => {
    const savedProgress = createEmptyProgress()
    savedProgress.profileName = 'Bruno'
    localStorage.setItem(storageKey, JSON.stringify(savedProgress))

    render(<App />)

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
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      )
      expect(saved.practiceResults['verify-frequency-claim'].score).toBe(4)
      expect(saved.practiceResults['verify-frequency-claim'].total).toBe(4)
      expect(saved.xp).toBe(12)
    })
  })

  it('deve atualizar o dashboard após a conclusão de um módulo', async () => {
    const savedProgress = createEmptyProgress()
    savedProgress.profileName = 'Bruno'
    localStorage.setItem(storageKey, JSON.stringify(savedProgress))

    render(<App />)

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
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      )
      expect(saved.completedLessons).toContain('generative-ai')
      expect(saved.xp).toBe(25)
    })

    fireEvent.click(
      screen.getByRole('button', { name: /Voltar à trilha/ }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Visão geral' }),
    )

    expect(screen.getByText(/1 de \d+ módulos/)).toBeTruthy()
    expect(screen.getByText('MÓDULOS CONCLUÍDOS')).toBeTruthy()
  })

  it('deve apresentar o resultado final consolidando quizzes e práticas', async () => {
    const savedProgress = createEmptyProgress()
    savedProgress.profileName = 'Bruno'
    savedProgress.quizResults.hallucinations = {
      score: 2,
      total: 3,
      completedAt: '2026-11-16T12:00:00.000Z',
      incorrectTopics: ['Checagem de fontes'],
    }
    savedProgress.practiceResults['verify-frequency-claim'] = {
      score: 3,
      total: 4,
      completedAt: '2026-11-16T12:05:00.000Z',
      correctIds: ['source', 'date', 'calculation'],
    }
    localStorage.setItem(storageKey, JSON.stringify(savedProgress))

    render(<App />)

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
