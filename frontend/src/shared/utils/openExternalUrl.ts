/**
 * Abre URL externa numa nova aba e mantém o Teglion aberto.
 *
 * Importante: NÃO passar `noopener` em windowFeatures — em Chrome/Safari
 * `window.open` devolve `null` mesmo quando a aba abre, e um fallback com
 * `location.assign` navega a aba actual (Teglion “fecha” + AfDigital duplicada).
 *
 * Preferir `<a target="_blank" rel="noopener noreferrer">` na UI; esta helper
 * serve para fluxos programáticos (checkout, OAuth, etc.).
 */
export function openExternalUrl(url: string): boolean {
  const href = String(url || '').trim()
  if (!href) return false

  try {
    const opened = window.open(href, '_blank')
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

  // Pop-up bloqueado: âncora temporária (nova aba) — nunca location.assign.
  try {
    const a = document.createElement('a')
    a.href = href
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.referrerPolicy = 'no-referrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
    return true
  } catch {
    return false
  }
}
