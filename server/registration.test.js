// @vitest-environment node
import { afterEach, expect, it } from 'vitest'
import { createServer } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { openDatabase } from './database.js'
import { createApi } from './routes.js'

const cleanup = []
afterEach(async () => { for (const fn of cleanup.splice(0).reverse()) await fn() })
it('valida, normaliza, persiste usuários e sessões e impede duplicidade após reiniciar', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'learnai-'))
  cleanup.push(() => rmSync(dir, { recursive: true, force: true }))
  const filename = join(dir, 'test.sqlite')
  let store = openDatabase(filename)
  cleanup.push(() => store.db.close())
  const server = createServer((req, res) => createApi(store)(req, res, () => { res.statusCode = 404; res.end() }))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  cleanup.push(() => new Promise(resolve => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}`
  const register = (nome, email) => fetch(`${url}/api/usuarios`, { method: 'POST', body: JSON.stringify({ nome, email }) })
  expect((await register('   ', 'a@example.com')).status).toBe(400)
  expect((await register('Ana', 'invalido')).status).toBe(400)
  const created = await register(' Ana ', ' ANA@EXAMPLE.COM ')
  expect(created.status).toBe(201)
  const user = (await created.json()).usuario
  expect(user).toMatchObject({ nome: 'Ana', email: 'ana@example.com' })
  const cookie = created.headers.get('set-cookie').split(';')[0]
  store.db.close(); store = openDatabase(filename)
  const session = await fetch(`${url}/api/sessao`, { headers: { cookie } })
  expect((await session.json()).usuario.id).toBe(user.id)
  const duplicate = await register('Outra Ana', 'ANA@example.com')
  expect(duplicate.status).toBe(409)
  expect(await duplicate.json()).toEqual({ error: 'E-mail já cadastrado' })
  await fetch(`${url}/api/sessao`, { method: 'DELETE', headers: { cookie } })
  expect((await (await fetch(`${url}/api/sessao`, { headers: { cookie } })).json()).usuario).toBeNull()
  expect((await register('Bruno', 'bruno@example.com')).status).toBe(201)
  expect(store.db.prepare('SELECT count(*) AS total FROM usuarios').get().total).toBe(2)
  expect(() => store.createUser('Ana', 'ana@example.com')).toThrow()
})
