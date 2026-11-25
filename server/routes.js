import { randomBytes } from 'node:crypto'
import { validateRegistration } from '../shared/registration.js'
import { hashPassword, verifyPassword } from './passwords.js'
import { defaultSiteContent } from '../shared/site-content.js'
import { isDuplicateEmail } from './database.js'

async function readBody(req) {
  let body = ''
  for await (const chunk of req) {
    body += chunk
    if (Buffer.byteLength(body) > 8192) throw new Error('body-size')
  }
  return JSON.parse(body)
}

/**
 * Recebe o store do banco (ou a promessa dele, ou uma função que o abre) e devolve o
 * middleware da API. Com uma função, se a abertura falhar (ex.: o Turso recusar a conexão
 * enquanto outra função migra o banco), a próxima requisição tenta abrir de novo em vez de
 * responder 500 para sempre naquela instância.
 */
export function createApi(store) {
  const reopen = typeof store === 'function'
  let ready = null
  const openStore = () => {
    if (!ready) {
      const attempt = Promise.resolve(reopen ? store() : store)
      ready = attempt
      // Se o banco não abrir, a requisição responde 500, sem derrubar o processo.
      attempt.catch(error => {
        console.error('[learnai-api] Falha ao abrir o banco:', error)
        if (reopen && ready === attempt) ready = null
      })
    }
    return ready
  }
  const dummyHash = hashPassword(randomBytes(32).toString('hex'))
  return async (req, res, next) => {
    const path = (req.url || '').split('?')[0]
    if (!path.startsWith('/api/')) return next()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)) }
    const token = /(?:^|;\s*)learnai_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1] || ''
    const cookie = (value, age) => res.setHeader('Set-Cookie', `learnai_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)
    try {
      const store = await openStore()
      if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`)
        return send(403, { error: 'Origem da solicitação não permitida.' })
      if (path === '/api/sessao' && req.method === 'GET')
        return send(200, { usuario: (await store.session(token)) || null })
      if (path === '/api/sessao' && req.method === 'DELETE') {
        await store.signOut(token); cookie('', 0)
        return send(200, { mensagem: 'Você saiu do perfil.' })
      }
      if (path === '/api/conteudo' && req.method === 'GET')
        return send(200, { conteudo: (await store.readContent()) || defaultSiteContent })
      if (path === '/api/admin/conteudo' && req.method === 'PUT') {
        const user = await store.session(token)
        if (!user) return send(401, { error: 'Entre na sua conta para continuar.' })
        if (user.perfil !== 'admin') return send(403, { error: 'Acesso permitido apenas para administradores.' })
        let input
        try { input = await readBody(req) } catch { return send(400, { error: 'Conteúdo inválido ou muito grande.' }) }
        const content = {}
        for (const key of Object.keys(defaultSiteContent)) {
          const limit = key.toLowerCase().includes('titulo') ? 100 : 1000
          if (typeof input?.[key] !== 'string' || !input[key].trim() || input[key].trim().length > limit)
            return send(400, { error: `Preencha os títulos (até 100 caracteres) e descrições (até 1000 caracteres).` })
          content[key] = input[key].trim()
        }
        await store.saveContent(content)
        return send(200, { conteudo: content })
      }
      if (['/api/usuarios', '/api/login'].includes(path) && req.method === 'POST') {
        // Na Vercel o endereço da conexão é do proxy; o IP do visitante vem em x-real-ip.
        const key = (process.env.VERCEL && req.headers['x-real-ip']) || req.socket.remoteAddress || 'local'
        if (await store.countAttempt(key) > 20) return send(429, { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' })
        let body = ''
        for await (const chunk of req) {
          body += chunk
          if (Buffer.byteLength(body) > 4096) return send(413, { error: 'Formulário muito grande.' })
        }
        let input
        try { input = JSON.parse(body) } catch { return send(400, { error: 'Formulário inválido.' }) }
        const data = validateRegistration(path === '/api/login' ? { ...input, nome: 'Login' } : input)
        if (data.error) return send(400, { error: data.error })
        const senha = input?.senha
        if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128)
          return send(400, { error: 'A senha deve ter entre 8 e 128 caracteres.' })
        if (path === '/api/login') {
          const credentials = await store.findCredentials(data.email)
          const valid = await verifyPassword(senha, credentials?.senha_hash || await dummyHash)
          if (!credentials?.senha_hash || !valid) return send(401, { error: 'E-mail ou senha incorretos.' })
          const selectedRole = input.perfil || 'usuario'
          if (!['usuario', 'admin'].includes(selectedRole) || selectedRole !== credentials.perfil)
            return send(403, { error: 'Este cadastro não possui o perfil selecionado.' })
          const newToken = randomBytes(32).toString('hex')
          await store.replaceSession(token, newToken, credentials.id)
          cookie(newToken, 30 * 86400)
          const { senha_hash, ...usuario } = credentials
          return send(200, { usuario })
        }
        const hash = await hashPassword(senha)
        const newToken = randomBytes(32).toString('hex')
        try {
          const usuario = await store.registerWithSession(data.nome, data.email, hash, newToken, token)
          cookie(newToken, 30 * 86400)
          return send(201, { usuario })
        } catch (error) {
          if (isDuplicateEmail(error)) return send(409, { error: 'E-mail já cadastrado' })
          throw error
        }
      }
      send(404, { error: 'Endpoint não encontrado.' })
    } catch (error) {
      console.error(`[learnai-api] ${req.method} ${path}:`, error)
      send(500, { error: 'Não foi possível concluir a solicitação. Tente novamente.' })
    }
  }
}
