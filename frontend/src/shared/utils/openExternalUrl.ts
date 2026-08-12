/**
 * Abre URL externa numa nova aba e mantém o Teglion aberto.
 * Se o browser bloquear pop-ups, faz fallback para a mesma aba.
 */
export function openExternalUrl(url: string): boolean {
  const href = String(url || '').trim()
  if (!href) return false

  try {
    const opened = window.open(href, '_blank', 'noopener,noreferrer')
    if (opened) {
      try {
        opened.opener = null
      } catch {
        /* ignore */
      }
      return true
    }
  } catch {
    /* fall through */
  }

  window.location.assign(href)
  return false
}
