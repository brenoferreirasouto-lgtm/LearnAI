import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountRequest } from './accounts'

const usuario = { id: 1, nome: 'Ana', email: 'ana@example.com', criado_em: '2026-11-23T00:00:00.000Z', perfil: 'usuario' as const }

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('accountRequest (F15)', () => {
  it('envia o cadastro para a API e devolve o usuário criado', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ usuario }) })
    vi.stubGlobal('fetch', fetch)

    const body = { nome: 'Ana', email: 'ana@example.com', senha: 'senha-teste-123' }
    await expect(accountRequest('/api/usuarios', 'POST', body)).resolves.toEqual({ usuario })
    expect(fetch).toHaveBeenCalledWith('/api/usuarios', expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }))
  })

  it('mostra a mensagem de erro que a API devolve', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'E-mail já cadastrado' }) }))
    await expect(accountRequest('/api/usuarios', 'POST', {})).rejects.toThrow('E-mail já cadastrado')
  })

  it('sem conexão com o servidor, avisa em vez de criar a conta só no navegador', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(accountRequest('/api/usuarios', 'POST', { nome: 'Ana', email: 'ana@example.com', senha: 'senha-teste-123' }))
      .rejects.toThrow('Servidor indisponível')
    expect(Object.keys(localStorage).filter(key => key.startsWith('learnai.deploy'))).toEqual([])
  })

  it('com a API ausente (página 404 sem JSON), avisa que o servidor está indisponível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => { throw new SyntaxError('Unexpected token <') } }))
    await expect(accountRequest('/api/sessao')).rejects.toThrow('Servidor indisponível')
  })
})
