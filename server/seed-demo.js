import { openDatabase } from './database.js'
import { hashPassword } from './passwords.js'

const store = openDatabase()
try {
  const accounts = [
    { nome: 'Administrador Learn AI', email: 'admin@learnai.local', senha: 'AdminLearnAI!2026', perfil: 'admin' },
    { nome: 'Usuário de demonstração', email: 'usuario@learnai.local', senha: 'UsuarioLearnAI!2026', perfil: 'usuario' },
  ]
  for (const account of accounts) {
    const existing = store.findCredentials(account.email)
    if (existing) {
      console.log(`Cadastro ${account.email} já existe; credenciais e permissões preservadas.`)
      continue
    }
    const hash = await hashPassword(account.senha)
    store.db.exec('BEGIN IMMEDIATE')
    try {
      const user = store.createUser(account.nome, account.email, hash)
      store.db.prepare('UPDATE usuarios SET perfil = ? WHERE id = ?').run(account.perfil, user.id)
      store.db.exec('COMMIT')
      console.log(`Perfil ${account.perfil} criado: ${account.email}`)
    } catch (error) { store.db.exec('ROLLBACK'); throw error }
  }
} finally { store.db.close() }
