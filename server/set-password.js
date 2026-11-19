import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { openDatabase } from './database.js'
import { hashPassword } from './passwords.js'

// Ferramenta administrativa local: nunca recebe a senha pela linha de comando.
const email = process.argv[2]?.trim().toLowerCase()
if (!email || !process.stdin.isTTY) {
  console.error('Use em um terminal interativo: npm run definir-senha -- email@exemplo.com')
  process.exit(1)
}
const store = await openDatabase()
const silent = new Writable({ write(_chunk, _encoding, callback) { callback() } })
const terminal = createInterface({ input: process.stdin, output: silent, terminal: true })
try {
  const user = await store.findCredentials(email)
  if (!user) throw new Error('Cadastro não encontrado.')
  process.stdout.write('Nova senha (8 a 128 caracteres; entrada oculta): ')
  const password = await terminal.question('')
  process.stdout.write('\nConfirme a senha: ')
  const confirmation = await terminal.question('')
  process.stdout.write('\n')
  if (password.length < 8 || password.length > 128) throw new Error('A senha deve ter entre 8 e 128 caracteres.')
  if (password !== confirmation) throw new Error('As senhas não coincidem.')
  const hash = await hashPassword(password)
  await store.resetPassword(user.id, hash)
  console.log('Senha definida. Agora entre no site usando seu e-mail e senha.')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally { terminal.close(); store.close() }
