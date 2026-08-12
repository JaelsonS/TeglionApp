import DOMPurify from 'dompurify'

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'ul', 'ol', 'li', 'br', 'p', 'div']

/** Sanitiza HTML de descrição de serviço (allowlist restrita). */
export function sanitizeServiceHtml(html: string | null | undefined): string {
  const raw = String(html || '')
  if (!raw.trim()) return ''
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  })
}
