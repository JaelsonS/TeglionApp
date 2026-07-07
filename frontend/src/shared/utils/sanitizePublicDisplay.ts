const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MONGO_OBJECT_ID_RE = /^[0-9a-f]{24}$/i

/** Identificadores internos (UUID, ObjectId) — nunca mostrar na UI pública. */
export function isInternalIdentifier(value: string | null | undefined): boolean {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return false
  return UUID_RE.test(trimmed) || MONGO_OBJECT_ID_RE.test(trimmed)
}

/** Texto seguro para subtítulos, branding e mensagens ao utilizador. */
export function sanitizePublicLabel(value: string | null | undefined): string | undefined {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || isInternalIdentifier(trimmed)) return undefined
  return trimmed
}

const UUID_INLINE_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
const MONGO_INLINE_RE = /\b[0-9a-f]{24}\b/gi

/** Remove IDs embutidos em mensagens de erro antes de as mostrar ao utilizador. */
export function redactInternalIdentifiers(message: string): string {
  return message
    .replace(UUID_INLINE_RE, '')
    .replace(MONGO_INLINE_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
