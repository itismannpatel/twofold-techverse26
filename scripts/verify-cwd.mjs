import { createServer } from 'node:http'
import path from 'node:path'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'

const startupCwd = process.cwd()
const DB_DIR = path.join(startupCwd, 'server', 'db')
const DB_FILE = path.join(DB_DIR, 'twofold.db')
const SCHEMA_FILE = path.join(startupCwd, 'server', 'db', 'schema.sql')

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true })

const schema = readFileSync(SCHEMA_FILE, 'utf8')
const db = new Database(DB_FILE)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(schema)

let seeded = false
try {
  const row = db.prepare("SELECT value FROM meta WHERE key='version'").get()
  if (!row) {
    db.prepare("INSERT INTO meta (key,value) VALUES ('version','2')").run()
    seeded = true
  }
} finally {
  db.close()
}

const PORT = 9878
const server = createServer((req, res) => {
  const cwd = process.cwd()
  let metaRow, countRow
  try {
    const checkDb = new Database(DB_FILE)
    metaRow = checkDb.prepare("SELECT value FROM meta WHERE key='version'").get()
    countRow = checkDb.prepare('SELECT COUNT(*) AS n FROM users').get()
    checkDb.close()
  } catch (err) {
    metaRow = null
    countRow = null
  }
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(
    `cwd=${cwd}\n` +
    `DB_FILE=${DB_FILE}\n` +
    `meta=${(metaRow && metaRow.value) || 'missing'}\n` +
    `users=${(countRow && countRow.n !== undefined) ? countRow.n : 'missing'}\n` +
    `seeded=${seeded}\nschema_exists=${existsSync(SCHEMA_FILE)}`
  )
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`listening on 127.0.0.1:${PORT}`)
})
