// @vitest-environment node
import { afterEach, expect, it } from 'vitest'
import { createServer } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase } from './database.js'
import { createApi } from './routes.js'
import { DatabaseSync } from 'node:sqlite'
import { hashPassword } from './passwords.js'

const cleanup = []
afterEach(async () => { for (const fn of cleanup.splice(0).reverse()) await fn() })
it('valida, normaliza, persiste usuários e sessões e impede duplicidade após reiniciar', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'learnai-'))
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }))
  const filename = join(dir, 'test.sqlite')
  let store = openDatabase(filename)
  cleanup.push(() => store.db.close())
  let api = createApi(store)
  const server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  cleanup.push(() => new Promise(resolve => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}`
  const register = (nome, email, senha = 'senha-teste-123') => fetch(`${url}/api/usuarios`, { method: 'POST', body: JSON.stringify({ nome, email, senha }) })
  const login = (email, senha) => fetch(`${url}/api/login`, { method: 'POST', body: JSON.stringify({ email, senha }) })
  expect((await register('   ', 'a@example.com')).status).toBe(400)
  expect((await register('Ana', 'invalido')).status).toBe(400)
  expect((await register('Ana', 'a@example.com', 'curta')).status).toBe(400)
  const created = await register(' Ana ', ' ANA@EXAMPLE.COM ')
  expect(created.status).toBe(201)
  const user = (await created.json()).usuario
  expect(user).toMatchObject({ nome: 'Ana', email: 'ana@example.com' })
  expect(user.senha_hash).toBeUndefined()
  expect(store.findCredentials(user.email).senha_hash).not.toContain('senha-teste-123')
  const cookie = created.headers.get('set-cookie').split(';')[0]
  store.db.close(); store = openDatabase(filename)
  api = createApi(store)
  const session = await fetch(`${url}/api/sessao`, { headers: { cookie } })
  expect((await session.json()).usuario.id).toBe(user.id)
  const duplicate = await register('Outra Ana', 'ANA@example.com')
  expect(duplicate.status).toBe(409)
  expect(await duplicate.json()).toEqual({ error: 'E-mail já cadastrado' })
  await fetch(`${url}/api/sessao`, { method: 'DELETE', headers: { cookie } })
  expect((await (await fetch(`${url}/api/sessao`, { headers: { cookie } })).json()).usuario).toBeNull()
  expect((await login(user.email, 'senha-errada')).status).toBe(401)
  expect((await login('ausente@example.com', 'senha-teste-123')).status).toBe(401)
  const loggedIn = await login(' ANA@EXAMPLE.COM ', 'senha-teste-123')
  expect(loggedIn.status).toBe(200)
  expect((await loggedIn.json()).usuario).toEqual(user)
  const loginCookie = loggedIn.headers.get('set-cookie').split(';')[0]
  store.db.close(); store = openDatabase(filename)
  api = createApi(store)
  const restored = await fetch(`${url}/api/sessao`, { headers: { cookie: loginCookie } })
  expect((await restored.json()).usuario).toEqual(user)
  expect(loggedIn.headers.get('set-cookie')).toContain('HttpOnly')
  expect((await register('Bruno', 'bruno@example.com')).status).toBe(201)
  expect(store.db.prepare('SELECT count(*) AS total FROM usuarios').get().total).toBe(2)
  expect(() => store.createUser('Ana', 'ana@example.com')).toThrow()
  for (let index = 0; index < 20; index++) await register('', '')
  expect((await login(user.email, 'senha-teste-123')).status).toBe(429)
})

it('migra contas antigas sem apagar usuários e permite definir a primeira senha', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'learnai-migration-'))
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }))
  const filename = join(dir, 'old.sqlite')
  const old = new DatabaseSync(filename)
  old.exec(`CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, criado_em TEXT DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO usuarios (nome, email) VALUES ('Bruno', 'bruno@bruno.com')`)
  old.close()
  const store = openDatabase(filename)
  cleanup.push(() => store.db.close())
  const user = store.findCredentials('bruno@bruno.com')
  expect(user.senha_hash).toBeNull()
  store.setPassword(user.id, await hashPassword('nova-senha-segura'))
  expect(store.findCredentials(user.email).id).toBe(user.id)
  expect(store.findCredentials(user.email).senha_hash).toBeTruthy()
})
