/**
 * Gera catalog.json (só metadados) para o índice do blog carregar sem os blocos dos artigos.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { BLOG_POSTS } from '../src/content/blog/all-posts.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '../src/content/blog/catalog.json')

const catalog = BLOG_POSTS.map(({ blocks: _blocks, seo, ...meta }) => ({
  ...meta,
  seo: { title: seo.title, description: seo.description, keywords: [] as string[] },
}))

writeFileSync(out, `${JSON.stringify(catalog)}\n`, 'utf8')
console.log(`[blog] catalog.json (${catalog.length} artigos)`)
