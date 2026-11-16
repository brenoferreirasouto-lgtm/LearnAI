export type Usuario = { id: number; nome: string; email: string; criado_em: string }

export async function accountRequest(path: string, method = 'GET', body?: unknown) {
  let response: Response
  try {
    response = await fetch(path, {
      method, credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch { throw new Error('Não foi possível conectar ao servidor. Tente novamente.') }
  let data
  try { data = await response.json() }
  catch { throw new Error('Servidor indisponível. Tente novamente.') }
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.')
  return data as { usuario: Usuario | null }
}
