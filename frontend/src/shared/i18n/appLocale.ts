/** TegLion — pt-PT only (multilíngue = fase futura). */
export type AppLocale = 'pt-PT' | 'pt-BR'

export const APP_LOCALE: AppLocale = 'pt-PT'

export const APP_LOCALES: Array<{ value: AppLocale; label: string }> = [
  { value: 'pt-PT', label: '🇵🇹 PT' },
]

export const APP_LOCALE_STORAGE_KEY = 'TegLion.locale'
export const APP_LOCALE_CHANGED_EVENT = 'contabil:locale-changed'

export function normalizeAppLocale(raw?: string | null): AppLocale {
  const v = String(raw || '').trim()
  if (v === 'pt-BR' || v === 'pt-br') return 'pt-BR'
  return 'pt-PT'
}

export function getInitialAppLocale(): AppLocale {
  return APP_LOCALE
}

export function announceAppLocale(locale: AppLocale) {
  try {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent<AppLocale>(APP_LOCALE_CHANGED_EVENT, { detail: locale }))
  } catch {
  }
}
