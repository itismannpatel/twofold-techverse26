#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = fileURLToPath(import.meta.url)
const projectRoot = join(dirname(here), '..')
const [,, ...args] = process.argv

if (args.length === 0) {
  console.error('usage: node scripts/tsx-run.mjs "<tsx code>"')
  process.exit(2)
}

const child = spawn('npm', ['exec', '--silent', 'tsx', '--', '-e', args[0]], {
  cwd: projectRoot,
  stdio: ['ignore', 'inherit', 'inherit'],
})

child.on('exit', (code) => process.exit(code ?? 1))
