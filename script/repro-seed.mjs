import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const here = fileURLToPath(import.meta.url)
const root = path.resolve(path.dirname(here), '..')

const { default: Database } = await import('better-sqlite3')
const sql = readFileSync(path.join(root, 'server/db/schema.sql'), 'utf8')

const DB_FILE = path.join(root, 'server/db/twofold.db')
const db1 = new Database(DB_FILE)
db1.pragma('journal_mode = WAL')
db1.pragma('foreign_keys = ON')
db1.exec(sql)
if (!db1.prepare('SELECT COUNT(*) AS n FROM users').get().n) {
  db1.prepare("INSERT OR IGNORE INTO meta (key,value) VALUES ('version','2')").run()
}
db1.close()

const db2 = new Database(DB_FILE)
const idRow = db2.prepare("SELECT value FROM meta WHERE key='version'").get()
const counts = db2.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM sessions) AS sessions, (SELECT COUNT(*) FROM messages) AS messages, (SELECT COUNT(*) FROM reviews) AS reviews FROM meta').get()
console.log('second open version', idRow && idRow.value, '| counts', counts, '| users table?', !!db2.prepare('SELECT 1 FROM sqlite_master WHERE type=\'table\' AND name=\'users\'').get())
db2.close()
