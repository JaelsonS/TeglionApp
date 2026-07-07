let contabilStylesLoaded = false

/** CSS do painel — não carregar em blog/landing (menos CSS bloqueante no PageSpeed). */
export function ensureContabilStyles() {
  if (contabilStylesLoaded || typeof document === 'undefined') return
  contabilStylesLoaded = true
  void import('@/shared/styles/contabil.css')
}
