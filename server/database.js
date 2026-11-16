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
  return {
    db,
    createUser(nome, email) {
      return db.prepare('INSERT INTO usuarios (nome, email) VALUES (?, ?) RETURNING *').get(nome, email)
    },
    createSession(token, id) {
      db.prepare('DELETE FROM sessoes WHERE expira_em < ?').run(Date.now())
      db.prepare('INSERT INTO sessoes VALUES (?, ?, ?)').run(token, id, Date.now() + 30 * 86400000)
    },
    session(token) {
      return db.prepare(`SELECT u.* FROM usuarios u JOIN sessoes s ON s.usuario_id = u.id
        WHERE s.token = ? AND s.expira_em > ?`).get(token, Date.now())
    },
    signOut(token) { db.prepare('DELETE FROM sessoes WHERE token = ?').run(token) },
  }
}
