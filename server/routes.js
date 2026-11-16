import { randomBytes } from 'node:crypto'
import { validateRegistration } from '../shared/registration.js'

export function createApi(store) {
  return async (req, res, next) => {
    const path = (req.url || '').split('?')[0]
    if (!path.startsWith('/api/')) return next()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)) }
    const token = /(?:^|;\s*)learnai_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1] || ''
    const cookie = (value, age) => res.setHeader('Set-Cookie', `learnai_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
    try {
      if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`)
        return send(403, { error: 'Origem da solicitação não permitida.' })
      if (path === '/api/sessao' && req.method === 'GET')
        return send(200, { usuario: store.session(token) || null })
      if (path === '/api/sessao' && req.method === 'DELETE') {
        store.signOut(token); cookie('', 0)
        return send(200, { mensagem: 'Você saiu do perfil.' })
      }
      if (path === '/api/usuarios' && req.method === 'POST') {
        let body = ''
        for await (const chunk of req) {
          body += chunk
          if (Buffer.byteLength(body) > 4096) return send(413, { error: 'Formulário muito grande.' })
        }
        let input
        try { input = JSON.parse(body) } catch { return send(400, { error: 'Formulário inválido.' }) }
        const data = validateRegistration(input)
        if (data.error) return send(400, { error: data.error })
        store.db.exec('BEGIN IMMEDIATE')
        try {
          const usuario = store.createUser(data.nome, data.email)
          const newToken = randomBytes(32).toString('hex')
          store.signOut(token)
          store.createSession(newToken, usuario.id)
          store.db.exec('COMMIT')
          cookie(newToken, 30 * 86400)
          return send(201, { usuario })
        } catch (error) {
          store.db.exec('ROLLBACK')
          if (error.code === 'ERR_SQLITE_ERROR' && error.errcode === 2067)
            return send(409, { error: 'E-mail já cadastrado' })
          throw error
        }
      }
      send(404, { error: 'Endpoint não encontrado.' })
    } catch {
      send(500, { error: 'Não foi possível concluir a solicitação. Tente novamente.' })
    }
  }
}
