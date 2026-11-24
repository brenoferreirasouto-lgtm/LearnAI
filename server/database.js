import { createClient } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const SESSION_DAYS = 30

/**
 * Escolhe o banco:
 * - `openDatabase(':memory:')`: banco em memória, usado nos testes;
 * - `openDatabase('caminho.sqlite')`: arquivo local;
 * - sem argumento: Turso, se TURSO_DATABASE_URL estiver definida (produção na Vercel);
 *   senão o arquivo de DATABASE_PATH ou data/learnai.sqlite (desenvolvimento).
 */
function clientConfig(filename) {
  if (filename === ':memory:') return { url: ':memory:' }
  if (!filename && process.env.TURSO_DATABASE_URL)
    return { url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN }
  if (!filename && process.env.VERCEL)
    throw new Error('Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN no projeto da Vercel.')
  const path = resolve(filename || process.env.DATABASE_PATH || 'data/learnai.sqlite')
  mkdirSync(dirname(path), { recursive: true })
  return { url: pathToFileURL(path).href }
}

function plain(row) {
  return row ? { ...row } : undefined
}

async function migrate(db) {
  await db.executeMultiple(`PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL CHECK(length(trim(nome)) BETWEEN 1 AND 60),
      email TEXT NOT NULL UNIQUE CHECK(email = lower(trim(email))),
      criado_em TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE TABLE IF NOT EXISTS sessoes (
      token TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      expira_em INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conteudo_site (id INTEGER PRIMARY KEY CHECK(id = 1), dados TEXT NOT NULL);`)
  const columns = (await db.execute('PRAGMA table_info(usuarios)')).rows.map(column => column.name)
  // Na Vercel cada rota é uma função própria; várias podem migrar o mesmo banco ao mesmo tempo.
  // Se outra já criou a coluna, o "duplicate column name" não é erro.
  const addColumn = async (sql) => {
    try { await db.execute(sql) } catch (error) {
      if (!/duplicate column name/i.test(error?.message || '')) throw error
    }
  }
  if (!columns.includes('senha_hash'))
    await addColumn('ALTER TABLE usuarios ADD COLUMN senha_hash TEXT')
  if (!columns.includes('perfil'))
    await addColumn("ALTER TABLE usuarios ADD COLUMN perfil TEXT NOT NULL DEFAULT 'usuario' CHECK(perfil IN ('usuario', 'admin'))")
}

export function isDuplicateEmail(error) {
  return error?.rawCode === 2067 || error?.extendedCode === 'SQLITE_CONSTRAINT_UNIQUE'
}

export async function openDatabase(filename) {
  const db = createClient(clientConfig(filename))
  await migrate(db)
  const newSession = (token, userIdSql, args) => ({
    sql: `INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (?, ${userIdSql}, ?)`,
    args: [token, ...args, Date.now() + SESSION_DAYS * 86400000],
  })
  const dropExpired = () => ({ sql: 'DELETE FROM sessoes WHERE expira_em < ?', args: [Date.now()] })
  return {
    db,
    close() { db.close() },
    async findCredentials(email) {
      return plain((await db.execute({ sql: 'SELECT * FROM usuarios WHERE email = ?', args: [email] })).rows[0])
    },
    /** Troca a senha e encerra as sessões abertas da conta, numa única transação. */
    async resetPassword(id, hash) {
      await db.batch([
        { sql: 'UPDATE usuarios SET senha_hash = ? WHERE id = ?', args: [hash, id] },
        { sql: 'DELETE FROM sessoes WHERE usuario_id = ?', args: [id] },
      ], 'write')
    },
    async promoteToAdmin(email) {
      const result = await db.execute({ sql: "UPDATE usuarios SET perfil = 'admin' WHERE email = ? RETURNING id, nome, email, perfil", args: [email] })
      return plain(result.rows[0]) ?? null
    },
    async createUser(nome, email, hash = null) {
      const result = await db.execute({
        sql: 'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?) RETURNING id, nome, email, criado_em, perfil',
        args: [nome, email, hash],
      })
      return plain(result.rows[0])
    },
    /** Cria o usuário e já abre a sessão dele, encerrando a anterior, numa única transação. */
    async registerWithSession(nome, email, hash, newToken, previousToken) {
      const [, created] = await db.batch([
        { sql: 'DELETE FROM sessoes WHERE token = ?', args: [previousToken] },
        {
          sql: 'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?) RETURNING id, nome, email, criado_em, perfil',
          args: [nome, email, hash],
        },
        dropExpired(),
        newSession(newToken, '(SELECT id FROM usuarios WHERE email = ?)', [email]),
      ], 'write')
      return plain(created.rows[0])
    },
    async createSession(token, id) {
      await db.batch([dropExpired(), newSession(token, '?', [id])], 'write')
    },
    /** Encerra a sessão anterior e abre uma nova para a conta, numa única transação. */
    async replaceSession(previousToken, newToken, id) {
      await db.batch([
        { sql: 'DELETE FROM sessoes WHERE token = ?', args: [previousToken] },
        dropExpired(),
        newSession(newToken, '?', [id]),
      ], 'write')
    },
    async session(token) {
      const result = await db.execute({
        sql: `SELECT u.id, u.nome, u.email, u.criado_em, u.perfil FROM usuarios u JOIN sessoes s ON s.usuario_id = u.id
          WHERE s.token = ? AND s.expira_em > ?`,
        args: [token, Date.now()],
      })
      return plain(result.rows[0])
    },
    async signOut(token) {
      await db.execute({ sql: 'DELETE FROM sessoes WHERE token = ?', args: [token] })
    },
    async readContent() {
      const row = (await db.execute('SELECT dados FROM conteudo_site WHERE id = 1')).rows[0]
      return row ? JSON.parse(row.dados) : null
    },
    async saveContent(data) {
      await db.execute({
        sql: 'INSERT INTO conteudo_site (id, dados) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET dados = excluded.dados',
        args: [JSON.stringify(data)],
      })
    },
  }
}
