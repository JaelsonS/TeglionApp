import { COPY as recoverCopyByLocale } from '@/features/recover-password/i18n'
import { commonResourcesByLocale } from '@/shared/i18n/common-resources'
import { contabilPt } from '@/shared/i18n/contabilPt'

const ptResources = {
  common: commonResourcesByLocale['pt-PT'],
  recover: { copy: recoverCopyByLocale['pt-PT'] },
  /** Ponte Fase 2 — migrar consumidores de `contabilPt` para `useTranslation('contabil')`. */
  contabil: contabilPt,
} as const

/** Regista traduções completas (chunk async — fora do entry bundle). */
export function registerFullResources(i18n: {
  addResourceBundle: (
    lng: string,
    ns: string,
    bundle: unknown,
    deep?: boolean,
    overwrite?: boolean,
  ) => void
}) {
  const locales = ['pt-PT', 'pt', 'pt-pt'] as const
  for (const lng of locales) {
    for (const [ns, bundle] of Object.entries(ptResources)) {
      i18n.addResourceBundle(lng, ns, bundle, true, true)
    }
  }
}
