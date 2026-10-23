import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
console.log('process.cwd() at import time:', root)
console.log('server/db/schema.sql exists?', readFileSync(path.join(root, 'server/db/schema.sql'), 'utf8').length)
const dbDir = path.join(root, 'server/db')
try {
  readFileSync(path.join(dbDir, 'schema.sql'))
  console.log('server/db/ is readable:', dbDir)
} catch (e) {
  console.log('server/db/ read failed:', e.code)
}
