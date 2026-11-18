import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import AccountGate from './AccountGate'

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })
it('abre o perfil após cadastro e encerra a sessão antes de abrir outro formulário', async () => {
  localStorage.clear()
  const usuario = { id: 1, nome: 'Ana', email: 'ana@example.com', criado_em: '2026-11-16' }
  const fetch = vi.fn().mockImplementation(async (_path, options) => ({
    ok: true,
    json: async () => ({ usuario: options.method === 'POST' ? usuario : null }),
  }))
  vi.stubGlobal('fetch', fetch)
  vi.stubGlobal('scrollTo', vi.fn())
  render(<AccountGate />)
  fireEvent.change(await screen.findByLabelText('Como podemos chamar você?'), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-teste-123' } })
  fireEvent.click(screen.getByText('Criar meu espaço'))
  expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeTruthy()
  expect(screen.getByText('Cadastro realizado com sucesso.')).toBeTruthy()
  fireEvent.click(screen.getByText('Sair do perfil neste dispositivo'))
  expect(await screen.findByLabelText('E-mail')).toBeTruthy()
  expect(fetch).toHaveBeenLastCalledWith('/api/sessao', expect.objectContaining({ method: 'DELETE' }))
  expect((screen.getByLabelText('E-mail') as HTMLInputElement).value).toBe('')
  expect(screen.getByRole('heading', { name: 'Entre na sua conta' })).toBeTruthy()
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-teste-123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeTruthy()
  expect(screen.getByText('Login realizado com sucesso.')).toBeTruthy()
  fireEvent.click(screen.getByText('Criar outro cadastro neste dispositivo'))
  expect(await screen.findByRole('heading', { name: 'Comece por aqui' })).toBeTruthy()
  expect((screen.getByLabelText('Senha') as HTMLInputElement).value).toBe('')
})
