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

const PORT = 9877
const server = createServer((req, res) => {
  const cwd = process.cwd()
  const checkDb = new Database(DB_FILE)
  const meta = checkDb.prepare("SELECT value FROM meta WHERE key='version'").get()
  const users = checkDb.prepare('SELECT COUNT(*) AS n FROM users').get()
  checkDb.close()
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end(
    `cwd=${cwd}\nDB_FILE=${DB_FILE}\nmeta=${meta ? meta.value : 'missing'}\nusers=${users.n}\nseeded=${seeded}\nschema_exists=${existsSync(SCHEMA_FILE)}\n`
  )
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`listening on 127.0.0.1:${PORT}`)
})
