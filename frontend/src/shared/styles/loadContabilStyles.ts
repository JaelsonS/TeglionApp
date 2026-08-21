let contabilStylesLoaded = false
let contabilStylesPromise: Promise<void> | null = null

/** Disparado quando o CSS hashed 404 (deploy skew) — main.tsx faz hard-reload uma vez. */
export const STALE_ASSET_EVENT = 'teglion:stale-asset'

/** CSS do painel — não carregar em blog/landing (menos CSS bloqueante no PageSpeed). */
export function ensureContabilStyles() {
  if (contabilStylesLoaded || typeof document === 'undefined') return
  if (contabilStylesPromise) return

  // Vite: «Unable to preload CSS for /assets/contabil-*.css» em 404 após deploy.
  // Sem catch → unhandledrejection; com catch silencioso → app sem chrome do painel.
  // Pedimos um reload único para buscar o manifesto de assets novo.
  contabilStylesPromise = import('@/shared/styles/contabil.css')
    .then(() => {
      contabilStylesLoaded = true
    })
    .catch((err) => {
      contabilStylesPromise = null
      const message = String((err as { message?: string })?.message || err || '')
      if (message.includes('Unable to preload CSS') || message.includes('/assets/contabil-')) {
        try {
          window.dispatchEvent(new CustomEvent(STALE_ASSET_EVENT, { detail: message }))
        } catch {
          // noop
        }
      } else if (import.meta.env.DEV) {
        console.warn('[ensureContabilStyles] failed to load contabil.css', err)
      }
    })
}
