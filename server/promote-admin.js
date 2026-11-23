import { openDatabase } from './database.js'

// Promove a administrador uma conta já cadastrada pelo site.
// A senha é escolhida pela própria pessoa no cadastro e nunca passa por este comando.
const email = process.argv[2]?.trim().toLowerCase()
if (!email) {
  console.error('Use: npm run tornar-admin -- email@exemplo.com')
  process.exit(1)
}
const store = openDatabase()
try {
  const user = store.promoteToAdmin(email)
  if (!user) throw new Error('Cadastro não encontrado. Crie a conta pelo site antes de promovê-la.')
  console.log(`${user.email} agora é administrador. Entre no site selecionando o perfil Administrador.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally { store.db.close() }
