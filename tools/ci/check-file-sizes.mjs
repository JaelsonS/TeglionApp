import { readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')

const STRICT = [
  { file: 'frontend/src/infrastructure/api.ts', max: 100 },
  { file: 'backend/src/routes/contabil.routes.js', max: 10 },
  { file: 'backend/src/db/supabase/repositories/contabil.repository.js', max: 10 },
]

let failed = false

for (const { file, max } of STRICT) {
  const full = path.join(ROOT, file)
  const content = await readFile(full, 'utf8')
  const lines = content.split('\n').length
  if (lines > max) {
    console.error(`FAIL ${file}: ${lines} linhas (máx ${max})`)
    failed = true
  } else {
    console.log(`OK   ${file}: ${lines} linhas`)
  }
}

if (failed) process.exit(1)
console.log('Limites OK.')
