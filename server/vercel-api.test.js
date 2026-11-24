// @vitest-environment node
import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { createServer } from 'node:http'

// Simula a Vercel: cada arquivo de api/ responde a uma rota, com o banco vindo de TURSO_DATABASE_URL.
const routes = {
  '/api/sessao': '../api/sessao.js',
  '/api/conteudo': '../api/conteudo.js',
  '/api/usuarios': '../api/usuarios.js',
  '/api/login': '../api/login.js',
  '/api/admin/conteudo': '../api/admin/conteudo.js',
}
let server
let url

beforeAll(async () => {
  process.env.TURSO_DATABASE_URL = ':memory:'
  const handlers = Object.fromEntries(
    await Promise.all(Object.entries(routes).map(async ([path, file]) => [path, (await import(file)).default])),
  )
  server = createServer((req, res) => {
    const handler = handlers[(req.url || '').split('?')[0]]
    if (!handler) { res.statusCode = 404; return res.end() }
    return handler(req, res)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  url = `http://127.0.0.1:${server.address().port}`
})

afterAll(async () => {
  delete process.env.TURSO_DATABASE_URL
  await new Promise(resolve => server.close(resolve))
})

it('as funções da Vercel cadastram, mantêm a sessão, saem e entram de novo', async () => {
  const created = await fetch(`${url}/api/usuarios`, {
    method: 'POST',
    body: JSON.stringify({ nome: 'Ana', email: 'ana@example.com', senha: 'senha-teste-123' }),
  })
  expect(created.status).toBe(201)
  const cookie = created.headers.get('set-cookie').split(';')[0]

  const session = await (await fetch(`${url}/api/sessao`, { headers: { cookie } })).json()
  expect(session.usuario.email).toBe('ana@example.com')

  expect((await fetch(`${url}/api/admin/conteudo`, { method: 'PUT', body: '{}', headers: { cookie } })).status).toBe(403)
  expect((await (await fetch(`${url}/api/conteudo`)).json()).conteudo).toBeTruthy()

  await fetch(`${url}/api/sessao`, { method: 'DELETE', headers: { cookie } })
  expect((await (await fetch(`${url}/api/sessao`, { headers: { cookie } })).json()).usuario).toBeNull()

  const loggedIn = await fetch(`${url}/api/login`, {
    method: 'POST',
    body: JSON.stringify({ email: 'ana@example.com', senha: 'senha-teste-123' }),
  })
  expect(loggedIn.status).toBe(200)
})

it('se o banco falhar ao abrir, a próxima requisição tenta de novo em vez de ficar respondendo 500', async () => {
  const { createApi } = await import('./routes.js')
  const { openDatabase } = await import('./database.js')
  let attempts = 0
  const api = createApi(() => {
    attempts++
    return attempts === 1 ? Promise.reject(new Error('banco ocupado')) : openDatabase(':memory:')
  })
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  const local = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise(resolve => local.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${local.address().port}`
  try {
    expect((await fetch(`${base}/api/sessao`)).status).toBe(500)
    expect((await fetch(`${base}/api/sessao`)).status).toBe(200)
    expect(attempts).toBe(2)
    expect(errors).toHaveBeenCalled()
  } finally {
    errors.mockRestore()
    await new Promise(resolve => local.close(resolve))
  }
})
