/** i18next — TegLion pt-PT only (multilíngue = fase futura). */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { APP_LOCALE, APP_LOCALE_STORAGE_KEY, announceAppLocale, getInitialAppLocale } from '@/shared/i18n/appLocale'
import { criticalCommonResources } from '@/shared/i18n/critical-common'
import { humanizeI18nKey, isRawI18nKey } from '@/shared/i18n/keyFallback'

const initialLanguage = getInitialAppLocale()

const safeTranslatePostProcessor = {
  type: 'postProcessor' as const,
  name: 'safeTranslate',
  process(value: unknown, key: string | string[]) {
    if (typeof value !== 'string') return value
    const rawKey = Array.isArray(key) ? String(key[0] || '') : String(key || '')
    if (!rawKey) return value
    if (!isRawI18nKey(value, rawKey)) return value
    return humanizeI18nKey(rawKey)
  },
}

const ptResources = criticalCommonResources['pt-PT']

if (!i18n.isInitialized) {
  i18n
    .use(safeTranslatePostProcessor)
    .use(initReactI18next)
    .init({
      resources: {
        'pt-PT': ptResources,
        'pt-BR': ptResources,
        pt: ptResources,
        'pt-pt': ptResources,
        'pt-br': ptResources,
      },
      lng: initialLanguage,
      fallbackLng: 'pt-PT',
      supportedLngs: ['pt-PT', 'pt', 'pt-pt'],
      nonExplicitSupportedLngs: true,
      defaultNS: 'common',
      ns: ['common', 'contabil'],
      interpolation: { escapeValue: false },
      postProcess: ['safeTranslate'],
      returnNull: false,
      returnEmptyString: false,
      // Não humanizar aqui: senão sobrescreve `defaultValue` (ex.: menu em inglês).
      react: { useSuspense: false },
    })
}

i18n.on('languageChanged', () => {
  try {
    document.documentElement.lang = APP_LOCALE
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, APP_LOCALE)
    announceAppLocale(APP_LOCALE)
  } catch {
    // noop
  }
})

/** Carrega o catálogo completo (chunk separado) — só em rotas autenticadas. */
let fullI18nPromise: Promise<void> | null = null

export function ensureFullI18n(): Promise<void> {
  if (fullI18nPromise) return fullI18nPromise
  fullI18nPromise = import('@/shared/i18n/resources')
    .then(({ registerFullResources }) => {
      registerFullResources(i18n)
      return i18n.changeLanguage(APP_LOCALE)
    })
    .then(() => undefined)
    .catch((err) => {
      fullI18nPromise = null
      console.warn('[i18n] Falha ao carregar traduções completas', err)
    })
  return fullI18nPromise
}

export default i18n
