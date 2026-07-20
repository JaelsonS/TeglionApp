/** Eventos leves do funil blog → trial / newsletter (GTM / gtag se existir). */
export function trackBlogEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return
  try {
    const w = window as Window & {
      dataLayer?: Array<Record<string, unknown>>
      gtag?: (...args: unknown[]) => void
    }
    w.dataLayer?.push({ event: name, ...params })
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, params)
    }
  } catch {
    /* ignore */
  }
}
