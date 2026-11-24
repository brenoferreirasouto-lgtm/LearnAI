import type { SiteContent } from '../../shared/site-content'

export type Usuario = { id: number; nome: string; email: string; criado_em: string; perfil?: 'usuario' | 'admin' }

type RequestResult = { usuario: Usuario | null; conteudo?: SiteContent; mensagem?: string }

const UNAVAILABLE = 'Servidor indisponível. Tente novamente em instantes.'

/** Todas as contas ficam no servidor (API + banco). Não há mais cadastro só no navegador. */
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
    throw new Error(UNAVAILABLE)
  }

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(UNAVAILABLE)
  }

  if (!response.ok) throw new Error(data?.error || 'Não foi possível concluir a solicitação.')
  return data as RequestResult
}
