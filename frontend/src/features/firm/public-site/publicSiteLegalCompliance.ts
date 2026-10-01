import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'

import {
  DEFAULT_PRIVACY_TEMPLATE,
  DEFAULT_TERMS_TEMPLATE,
} from './publicSiteLegalTemplates'

export type PublicSiteLegalGapId = 'complaintsBook' | 'terms' | 'privacy'

export type PublicSiteLegalGap = {
  id: PublicSiteLegalGapId
  label: string
  detail: string
}

function norm(text: string | null | undefined): string {
  return String(text ?? '').trim()
}

function isHttpsUrl(value: string | null | undefined): boolean {
  const v = norm(value)
  if (!v) return false
  try {
    const u = new URL(v)
    return u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Texto ainda vazio ou só o modelo de referência (não adaptado pelo escritório). */
export function isPublicSitePolicyTextConfigured(text: string | null | undefined): boolean {
  const t = norm(text)
  if (!t) return false
  if (t === norm(DEFAULT_TERMS_TEMPLATE)) return false
  if (t === norm(DEFAULT_PRIVACY_TEMPLATE)) return false
  return true
}

export function evaluatePublicSiteLegalGaps(config: PublicSiteConfig): PublicSiteLegalGap[] {
  const gaps: PublicSiteLegalGap[] = []

  if (!isHttpsUrl(config.complaintsBookUrl)) {
    gaps.push({
      id: 'complaintsBook',
      label: 'Livro de Reclamações',
      detail: 'Indique o link do Livro de Reclamações (obrigação legal em Portugal).',
    })
  }

  if (!isPublicSitePolicyTextConfigured(config.termsText)) {
    gaps.push({
      id: 'terms',
      label: 'Termos de Utilização',
      detail: 'Revise e publique termos adaptados ao seu escritório (não deixe só o modelo vazio).',
    })
  }

  if (!isPublicSitePolicyTextConfigured(config.privacyText)) {
    gaps.push({
      id: 'privacy',
      label: 'Política de Privacidade',
      detail: 'Revise e publique a política de privacidade do escritório.',
    })
  }

  return gaps
}

export function publicSiteLegalFieldsDomId(): string {
  return 'public-site-legal-fields'
}
