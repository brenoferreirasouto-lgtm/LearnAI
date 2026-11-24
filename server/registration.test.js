// @vitest-environment node
import { afterEach, expect, it } from 'vitest'
import { createServer } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { isDuplicateEmail, openDatabase } from './database.js'
import { createApi } from './routes.js'
import { createClient } from '@libsql/client'
import { pathToFileURL } from 'node:url'
import { hashPassword } from './passwords.js'

const cleanup = []
afterEach(async () => { for (const fn of cleanup.splice(0).reverse()) await fn() })
it('valida, normaliza, persiste usuários e sessões e impede duplicidade após reiniciar', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'learnai-'))
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }))
  const filename = join(dir, 'test.sqlite')
  let store = await openDatabase(filename)
  cleanup.push(() => store.close())
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
  expect((await store.findCredentials(user.email)).senha_hash).not.toContain('senha-teste-123')
  const cookie = created.headers.get('set-cookie').split(';')[0]
  store.close(); store = await openDatabase(filename)
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
  store.close(); store = await openDatabase(filename)
  api = createApi(store)
  const restored = await fetch(`${url}/api/sessao`, { headers: { cookie: loginCookie } })
  expect((await restored.json()).usuario).toEqual(user)
  expect(loggedIn.headers.get('set-cookie')).toContain('HttpOnly')
  expect((await register('Bruno', 'bruno@example.com')).status).toBe(201)
  expect((await store.db.execute('SELECT count(*) AS total FROM usuarios')).rows[0].total).toBe(2)
  await expect(store.createUser('Ana', 'ana@example.com')).rejects.toThrow()
  for (let index = 0; index < 20; index++) await register('', '')
  expect((await login(user.email, 'senha-teste-123')).status).toBe(429)
})

it('abre o mesmo banco novo em várias funções ao mesmo tempo sem falhar na migração', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'learnai-concurrent-'))
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }))
  const filename = join(dir, 'new.sqlite')
  const stores = await Promise.all([openDatabase(filename), openDatabase(filename), openDatabase(filename)])
  for (const store of stores) cleanup.push(() => store.close())
  expect(await stores[1].readContent()).toBeNull()
  expect((await stores[2].createUser('Ana', 'ana@example.com')).perfil).toBe('usuario')
})

it('reconhece e-mail duplicado tanto no banco local quanto no Turso', () => {
  // Banco local (arquivo): o SQLite informa o código estendido.
  expect(isDuplicateEmail({ rawCode: 2067, extendedCode: 'SQLITE_CONSTRAINT_UNIQUE' })).toBe(true)
  // Turso por HTTP: só o código genérico e a mensagem do SQLite.
  const remote = Object.assign(new Error('SQLITE_CONSTRAINT: SQLite error: UNIQUE constraint failed: usuarios.email'), { code: 'SQLITE_CONSTRAINT' })
  expect(isDuplicateEmail(remote)).toBe(true)
  // Outras violações não viram "E-mail já cadastrado".
  expect(isDuplicateEmail(Object.assign(new Error('SQLITE_CONSTRAINT: SQLite error: CHECK constraint failed: perfil'), { code: 'SQLITE_CONSTRAINT' }))).toBe(false)
  expect(isDuplicateEmail(new Error('falha de rede'))).toBe(false)
})

it('migra contas antigas sem apagar usuários e permite definir a primeira senha', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'learnai-migration-'))
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }))
  const filename = join(dir, 'old.sqlite')
  const old = createClient({ url: pathToFileURL(filename).href })
  await old.executeMultiple(`CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, criado_em TEXT DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO usuarios (nome, email) VALUES ('Bruno', 'bruno@bruno.com')`)
  old.close()
  const store = await openDatabase(filename)
  cleanup.push(() => store.close())
  const user = await store.findCredentials('bruno@bruno.com')
  expect(user.senha_hash).toBeNull()
  await store.resetPassword(user.id, await hashPassword('nova-senha-segura'))
  expect((await store.findCredentials(user.email)).id).toBe(user.id)
  expect((await store.findCredentials(user.email)).senha_hash).toBeTruthy()
})
