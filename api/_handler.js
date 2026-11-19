import { openDatabase } from '../server/database.js'
import { createApi } from '../server/routes.js'

// Funções serverless da Vercel: cada arquivo de api/ atende uma rota e todos usam
// a mesma API do servidor de desenvolvimento, com o banco Turso de produção.
// Arquivos que começam com "_" não viram rota na Vercel.
const api = createApi(openDatabase())

export default function handler(req, res) {
  return api(req, res, () => {
    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Endpoint não encontrado.' }))
  })
}
