// Reproduce what the Vite plugin does: load server/db as an ES module
// the same way vite's config evaluation would, and check whether a
// second getDb() call throws away an existing persisted database.
import { pathToFileURL } from 'node:url'

const here = import.meta.url
// this script is inside scripts/, project root is one level up
const root = new URL('..', here).pathname
console.log('project root resolved to', root)

const serverDb = await import(pathToFileURL(new URL('server/db', root).pathname).href)
const getDb = serverDb.getDb
const db1 = getDb()
console.log('after first getDb -> exists?', true, 'wal pages?', db1.pragma('wal_checkpoint'))
const idRow = db1.prepare("SELECT value FROM meta WHERE key='version'").get()
console.log('meta version after first open', idRow)

// close that handle, then open again and see whether the persisted file is reused
db1.close()
const db2 = getDb()
const idRow2 = db2.prepare("SELECT value FROM meta WHERE key='version'").get()
console.log('meta version after second open', idRow2)
console.log('second open created a fresh db?', !(idRow && idRow2 && idRow.value === idRow2.value))
