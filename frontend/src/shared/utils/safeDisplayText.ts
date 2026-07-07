const LEGACY_PREFIX = 'U2FsdGVkX1'
const ENC_PREFIX = 'enc:v1:'

export function looksEncrypted(value?: string | null): boolean {
  if (!value?.trim()) return false
  const v = value.trim()
  return v.startsWith(ENC_PREFIX) || v.startsWith(LEGACY_PREFIX)
}

/** Evita mostrar blobs criptografados na UI (backend deve descriptografar; isto é fallback). */
export function safeDisplayText(value?: string | null, fallback = '—'): string {
  if (!value?.trim()) return fallback
  if (looksEncrypted(value)) return 'Conteúdo protegido'
  return value
}
