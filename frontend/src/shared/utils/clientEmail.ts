/** Formato mínimo de e-mail para convites / login do portal do cliente. */
const CLIENT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeClientEmail(email?: string | null): string {
  return String(email || '')
    .trim()
    .toLowerCase()
}

/** True quando o cadastro tem um e-mail utilizável para enviar convite. */
export function hasValidClientEmail(email?: string | null): boolean {
  const normalized = normalizeClientEmail(email)
  return normalized.length > 3 && CLIENT_EMAIL_RE.test(normalized)
}
