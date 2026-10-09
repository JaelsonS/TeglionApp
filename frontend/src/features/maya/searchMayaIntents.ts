import { MAYA_INTENTS, type MayaIntent } from '@/features/maya/mayaContent'

const PUBLIC_SITE_INTENT_IDS = new Set([
  'public-page',
  'public-page-featured',
  'public-page-logos',
  'public-page-media',
  'public-page-sections',
  'public-page-publish',
  'maya-setup',
  'maya-ai-addon',
  'activation-assistant',
  'service',
  'booking',
  'settings',
])

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2)
}

function scoreIntent(intent: MayaIntent, tokens: string[]): number {
  const hay = `${intent.title} ${intent.shortDescription} ${intent.answer} ${(intent.steps || []).join(' ')}`.toLowerCase()
  let score = 0
  for (const t of tokens) {
    if (hay.includes(t)) score += 1
  }
  if (PUBLIC_SITE_INTENT_IDS.has(intent.id)) score += 0.5
  return score
}

/** Pesquisa local nos guias estáticos (sem OpenAI). */
export function searchMayaIntents(query: string, limit = 3): MayaIntent[] {
  const tokens = tokenize(query.trim())
  if (!tokens.length) return []
  return [...MAYA_INTENTS]
    .filter((i) => i.surface !== 'client' && i.surface !== 'landing')
    .map((intent) => ({ intent, score: scoreIntent(intent, tokens) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.intent)
}
