import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export function openDatabase(filename = process.env.DATABASE_PATH || resolve('data/learnai.sqlite')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true })
  const db = new DatabaseSync(filename)
  db.exec(`PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
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
    );`)
  if (!db.prepare('PRAGMA table_info(usuarios)').all().some(column => column.name === 'senha_hash'))
    db.exec('ALTER TABLE usuarios ADD COLUMN senha_hash TEXT')
  if (!db.prepare('PRAGMA table_info(usuarios)').all().some(column => column.name === 'perfil'))
    db.exec("ALTER TABLE usuarios ADD COLUMN perfil TEXT NOT NULL DEFAULT 'usuario' CHECK(perfil IN ('usuario', 'admin'))")
  db.exec('CREATE TABLE IF NOT EXISTS conteudo_site (id INTEGER PRIMARY KEY CHECK(id = 1), dados TEXT NOT NULL)')
  return {
    db,
    findCredentials(email) { return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email) },
    setPassword(id, hash) { db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(hash, id) },
    createUser(nome, email, hash = null) {
      return db.prepare('INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?) RETURNING id, nome, email, criado_em, perfil').get(nome, email, hash)
    },
    createSession(token, id) {
      db.prepare('DELETE FROM sessoes WHERE expira_em < ?').run(Date.now())
      db.prepare('INSERT INTO sessoes VALUES (?, ?, ?)').run(token, id, Date.now() + 30 * 86400000)
    },
    session(token) {
      return db.prepare(`SELECT u.id, u.nome, u.email, u.criado_em, u.perfil FROM usuarios u JOIN sessoes s ON s.usuario_id = u.id
        WHERE s.token = ? AND s.expira_em > ?`).get(token, Date.now())
    },
    signOut(token) { db.prepare('DELETE FROM sessoes WHERE token = ?').run(token) },
    readContent() {
      const row = db.prepare('SELECT dados FROM conteudo_site WHERE id = 1').get()
      return row ? JSON.parse(row.dados) : null
    },
    saveContent(data) {
      db.prepare('INSERT INTO conteudo_site (id, dados) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET dados = excluded.dados').run(JSON.stringify(data))
    },
  }
}
