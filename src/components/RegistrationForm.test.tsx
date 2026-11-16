import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import RegistrationForm from './RegistrationForm'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('permite entrar com e-mail e senha e oferece preenchimento pelo navegador', async () => {
  const user = { id: 1, nome: 'Ana', email: 'ana@example.com' }
  const onCreated = vi.fn()
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ usuario: user }) })
  vi.stubGlobal('fetch', fetch)
  render(<RegistrationForm onCreated={onCreated} />)
  fireEvent.click(screen.getByText('Já tenho conta'))
  expect(screen.queryByLabelText('Como podemos chamar você?')).toBeNull()
  expect(screen.getByLabelText('Senha').getAttribute('autocomplete')).toBe('current-password')
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: ' ANA@EXAMPLE.COM ' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-teste-123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByRole('button', { name: 'Entrar' })
  expect(fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({ method: 'POST', body: JSON.stringify({ nome: 'Login', email: 'ana@example.com', senha: 'senha-teste-123' }) }))
  expect(onCreated).toHaveBeenCalledWith(user, true)
})
it('valida no navegador e limpa o formulário para outro cadastro', () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  render(<RegistrationForm onCreated={vi.fn()} />)
  fireEvent.change(screen.getByLabelText('Como podemos chamar você?'), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'invalido' } })
  fireEvent.click(screen.getByText('Criar meu espaço'))
  expect(screen.getByRole('alert').textContent).toBe('Informe um e-mail válido.')
  expect(fetch).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Criar outro cadastro neste dispositivo'))
  expect((screen.getByLabelText('E-mail') as HTMLInputElement).value).toBe('')
  expect((screen.getByLabelText('Como podemos chamar você?') as HTMLInputElement).value).toBe('')
})
it('mostra a mensagem exata de duplicidade retornada pelo servidor', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'E-mail já cadastrado' }) }))
  render(<RegistrationForm onCreated={vi.fn()} />)
  fireEvent.change(screen.getByLabelText('Como podemos chamar você?'), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-teste-123' } })
  fireEvent.click(screen.getByText('Criar meu espaço'))
  expect((await screen.findByRole('alert')).textContent).toBe('E-mail já cadastrado')
})
