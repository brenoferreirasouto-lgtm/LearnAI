import type { SiteContent } from '../../shared/site-content'
import { defaultSiteContent } from '../../shared/site-content'
import { validateRegistration } from '../../shared/registration.js'

export type Usuario = { id: number; nome: string; email: string; criado_em: string; perfil?: 'usuario' | 'admin' }

type LocalUser = Usuario & { passwordSalt: string; passwordHash: string }
type RequestResult = { usuario: Usuario | null; conteudo?: SiteContent; mensagem?: string }

const USERS_KEY = 'learnai.deploy.users.v1'
const SESSION_KEY = 'learnai.deploy.session.v1'
const CONTENT_KEY = 'learnai.deploy.content.v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(value: string) {
  const pairs = value.match(/.{1,2}/g) ?? []
  return Uint8Array.from(pairs.map(pair => Number.parseInt(pair, 16)))
}

async function hashLocalPassword(password: string, saltHex?: string) {
  const salt = saltHex ? fromHex(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' }, key, 256)
  return { salt: toHex(salt), hash: toHex(new Uint8Array(bits)) }
}

async function ensureDemoUsers() {
  const existing = readJson<LocalUser[]>(USERS_KEY, [])
  if (existing.length > 0) return existing

  const now = new Date().toISOString()
  const demos = [
    { id: 1, nome: 'Administrador Learn AI', email: 'admin@learnai.local', senha: 'AdminLearnAI!2026', perfil: 'admin' as const },
    { id: 2, nome: 'Usuário de demonstração', email: 'usuario@learnai.local', senha: 'UsuarioLearnAI!2026', perfil: 'usuario' as const },
  ]

  const users: LocalUser[] = []
  for (const demo of demos) {
    const password = await hashLocalPassword(demo.senha)
    users.push({
      id: demo.id,
      nome: demo.nome,
      email: demo.email,
      criado_em: now,
      perfil: demo.perfil,
      passwordSalt: password.salt,
      passwordHash: password.hash,
    })
  }
  writeJson(USERS_KEY, users)
  return users
}

function publicUser(user: LocalUser): Usuario {
  return { id: user.id, nome: user.nome, email: user.email, criado_em: user.criado_em, perfil: user.perfil }
}

async function localAccountRequest(path: string, method: string, body?: unknown): Promise<RequestResult> {
  const users = await ensureDemoUsers()
  const sessionId = Number(localStorage.getItem(SESSION_KEY) || 0)
  const current = users.find(user => user.id === sessionId) ?? null

  if (path === '/api/sessao' && method === 'GET')
    return { usuario: current ? publicUser(current) : null }

  if (path === '/api/sessao' && method === 'DELETE') {
    localStorage.removeItem(SESSION_KEY)
    return { usuario: null, mensagem: 'Você saiu do perfil.' }
  }

  if (path === '/api/conteudo' && method === 'GET')
    return { usuario: current ? publicUser(current) : null, conteudo: readJson<SiteContent>(CONTENT_KEY, defaultSiteContent) }

  if (path === '/api/admin/conteudo' && method === 'PUT') {
    if (!current) throw new Error('Entre na sua conta para continuar.')
    if (current.perfil !== 'admin') throw new Error('Acesso permitido apenas para administradores.')
    const input = body as Partial<SiteContent> | undefined
    const content = {} as SiteContent
    for (const key of Object.keys(defaultSiteContent) as (keyof SiteContent)[]) {
      const value = input?.[key]
      const limit = key.toLowerCase().includes('titulo') ? 100 : 1000
      if (typeof value !== 'string' || !value.trim() || value.trim().length > limit)
        throw new Error('Preencha os títulos (até 100 caracteres) e descrições (até 1000 caracteres).')
      content[key] = value.trim()
    }
    writeJson(CONTENT_KEY, content)
    return { usuario: publicUser(current), conteudo: content }
  }

  if (path === '/api/usuarios' && method === 'POST') {
    const input = body as Record<string, unknown> | undefined
    const data = validateRegistration(input)
    if (data.error) throw new Error(data.error)
    const senha = input?.senha
    if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128)
      throw new Error('A senha deve ter entre 8 e 128 caracteres.')
    if (users.some(user => user.email === data.email)) throw new Error('E-mail já cadastrado')

    const password = await hashLocalPassword(senha)
    const user: LocalUser = {
      id: Math.max(0, ...users.map(item => item.id)) + 1,
      nome: data.nome,
      email: data.email,
      criado_em: new Date().toISOString(),
      perfil: 'usuario',
      passwordSalt: password.salt,
      passwordHash: password.hash,
    }
    const nextUsers = [...users, user]
    writeJson(USERS_KEY, nextUsers)
    localStorage.setItem(SESSION_KEY, String(user.id))
    return { usuario: publicUser(user) }
  }

  if (path === '/api/login' && method === 'POST') {
    const input = body as Record<string, unknown> | undefined
    const data = validateRegistration({ ...input, nome: 'Login' })
    if (data.error) throw new Error(data.error)
    const senha = input?.senha
    if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128)
      throw new Error('A senha deve ter entre 8 e 128 caracteres.')

    const user = users.find(item => item.email === data.email)
    if (!user) throw new Error('E-mail ou senha incorretos. Se sua conta foi criada sem senha, defina a primeira senha pelo terminal do projeto.')
    const password = await hashLocalPassword(senha, user.passwordSalt)
    if (password.hash !== user.passwordHash)
      throw new Error('E-mail ou senha incorretos. Se sua conta foi criada sem senha, defina a primeira senha pelo terminal do projeto.')

    const selectedRole = input?.perfil
    if ((selectedRole !== 'usuario' && selectedRole !== 'admin') || selectedRole !== user.perfil)
      throw new Error('Este cadastro não possui o perfil selecionado.')

    localStorage.setItem(SESSION_KEY, String(user.id))
    return { usuario: publicUser(user) }
  }

  throw new Error('Endpoint não encontrado.')
}

export async function accountRequest(path: string, method = 'GET', body?: unknown): Promise<RequestResult> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    return localAccountRequest(path, method, body)
  }

  const contentType = response.headers?.get?.('content-type') || ''

  if (response.status === 404 && contentType && !contentType.includes('application/json'))
    return localAccountRequest(path, method, body)

  let data
  try {
    data = await response.json()
  } catch {
    if (response.status === 404) return localAccountRequest(path, method, body)
    throw new Error('Servidor indisponível. Tente novamente.')
  }

  if (response.status === 404)
    return localAccountRequest(path, method, body)

  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.')
  return data as RequestResult
}
