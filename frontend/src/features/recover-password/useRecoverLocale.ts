import { useCallback } from 'react'

import type { RecoverLocale } from './i18n'

const LOCALE: RecoverLocale = 'pt-PT'

export function useRecoverLocale() {
  const setLocale = useCallback((_next: RecoverLocale) => {
    // pt-PT only — selector desactivado até fase multilíngue
  }, [])

  return { locale: LOCALE, setLocale }
}
