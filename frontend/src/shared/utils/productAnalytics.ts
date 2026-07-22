/** Eventos leves de produto (GTM / gtag se existir). */
export function trackProductEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  if (typeof window === 'undefined') return
  try {
    const w = window as Window & {
      dataLayer?: Array<Record<string, unknown>>
      gtag?: (...args: unknown[]) => void
    }
    const clean = Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v !== undefined),
    )
    w.dataLayer?.push({ event: name, ...clean })
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, clean)
    }
  } catch {
    /* ignore */
  }
}
