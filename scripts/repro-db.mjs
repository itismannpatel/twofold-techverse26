import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = process.cwd()
// Dynamic import resolves server/index relative to cwd, which is the project root.
// That is what the Vite plugin does at boot.
const server = await import(pathToFileURL(path.join(root, 'server/index.ts')).href)
const { getDb } = server

const db1 = getDb()
console.log('after first getDb -> wal checkpoint', db1.pragma('wal_checkpoint'))
const idRow = db1.prepare("SELECT value FROM meta WHERE key='version'").get()
console.log('meta version after first open', idRow)

db1.close()

const db2 = getDb()
const idRow2 = db2.prepare("SELECT value FROM meta WHERE key='version'").get()
console.log('meta version after second open', idRow2)
console.log('second open created a fresh db?', !(idRow && idRow2 && idRow.value === idRow2.value))

db2.close()
