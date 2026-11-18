// @vitest-environment node
import { expect, it } from 'vitest'
import { createServer } from 'node:http'
import { openDatabase } from './database.js'
import { createApi } from './routes.js'
import { hashPassword } from './passwords.js'
import { defaultSiteContent } from '../shared/site-content.js'

it('protege edição por perfil e publica apenas conteúdo válido salvo pelo admin', async () => {
  const store = openDatabase(':memory:')
  const api = createApi(store)
  const server = createServer((req, res) => api(req, res, () => res.end()))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}`
  const request = (path, method = 'GET', data, cookie = '') => fetch(url + path, { method, headers: { cookie }, body: data === undefined ? undefined : JSON.stringify(data) })
  try {
    expect((await (await request('/api/conteudo')).json()).conteudo).toEqual(defaultSiteContent)
    expect((await request('/api/admin/conteudo', 'PUT', defaultSiteContent)).status).toBe(401)
    const registered = await request('/api/usuarios', 'POST', { nome: 'Pessoa', email: 'pessoa@example.com', senha: 'senha-segura123', perfil: 'admin' })
    expect((await registered.json()).usuario.perfil).toBe('usuario')
    const userCookie = registered.headers.get('set-cookie').split(';')[0]
    expect((await request('/api/admin/conteudo', 'PUT', defaultSiteContent, userCookie)).status).toBe(403)
    expect((await request('/api/login', 'POST', { email: 'pessoa@example.com', senha: 'senha-segura123', perfil: 'admin' })).status).toBe(403)
    const admin = store.createUser('Admin', 'admin@example.com', await hashPassword('admin-seguro123'))
    store.db.prepare("UPDATE usuarios SET perfil = 'admin' WHERE id = ?").run(admin.id)
    expect((await request('/api/login', 'POST', { email: admin.email, senha: 'admin-seguro123', perfil: 'usuario' })).status).toBe(403)
    const loggedIn = await request('/api/login', 'POST', { email: admin.email, senha: 'admin-seguro123', perfil: 'admin' })
    expect((await loggedIn.json()).usuario.perfil).toBe('admin')
    const adminCookie = loggedIn.headers.get('set-cookie').split(';')[0]
    expect((await request('/api/admin/conteudo', 'PUT', { ...defaultSiteContent, titulo: ' ' }, adminCookie)).status).toBe(400)
    const updated = { ...defaultSiteContent, titulo: 'Novo título do Learn AI' }
    expect((await request('/api/admin/conteudo', 'PUT', updated, adminCookie)).status).toBe(200)
    expect((await (await request('/api/conteudo')).json()).conteudo).toEqual(updated)
    expect(store.readContent()).toEqual(updated)
    store.db.prepare("UPDATE usuarios SET perfil = 'usuario' WHERE id = ?").run(admin.id)
    expect((await request('/api/admin/conteudo', 'PUT', defaultSiteContent, adminCookie)).status).toBe(403)
  } finally {
    await new Promise(resolve => server.close(resolve))
    store.db.close()
  }
})
