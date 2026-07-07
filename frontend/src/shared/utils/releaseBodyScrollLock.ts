/**
 * Liberta estilos de scroll no body/html quando Radix RemoveScroll fica preso (Safari/iPadOS).
 * Seguro chamar após fechar Dialog/Sheet — no-op se outro overlay ainda estiver aberto.
 */
export function releaseBodyScrollLock(): void {
  if (typeof document === 'undefined') return

  const stillLocked =
    document.querySelector('[data-state="open"][role="dialog"]') != null
  if (stillLocked) return

  const { body, documentElement: html } = document

  body.style.removeProperty('overflow')
  body.style.removeProperty('padding-right')
  body.style.removeProperty('pointer-events')
  body.removeAttribute('data-scroll-locked')

  html.style.removeProperty('overflow')
  html.removeAttribute('data-scroll-locked')
}
