import type { Client } from '@/shared/types/clients'

export type CompanyTypeLabel = 'Lda' | 'SA' | 'ENI' | 'Outro'

/** Forma jurídica (metadata) → etiqueta curta na lista de empresas. */
export function companyTypeFromLegalForm(legalForm?: string | null): CompanyTypeLabel | null {
  const lf = String(legalForm || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

  if (!lf.trim()) return null
  if (/anonima|anónima|\bsa\b/.test(lf)) return 'SA'
  if (/empresario|empresário|nome individual|\beni\b|eirl|estabelecimento individual/.test(lf)) {
    return 'ENI'
  }
  if (/quotas|unipessoal|limitada|\blda\b|sociedade por quotas/.test(lf)) return 'Lda'
  if (/cooperativa|outra/.test(lf)) return 'Outro'
  return null
}

export function companyTypeFromDisplayName(displayName?: string | null): CompanyTypeLabel | null {
  const s = String(displayName || '').toUpperCase()
  if (/\bS\.?\s*A\.?\b/.test(s) && !/\bLDA\b/.test(s)) return 'SA'
  if (/\bENI\b/.test(s)) return 'ENI'
  if (/\b(UNIPESSOAL|LDA)\b/.test(s)) return 'Lda'
  return null
}

export function resolveCompanyType(client: Client): CompanyTypeLabel {
  const fromForm = companyTypeFromLegalForm(client.fiscalProfile?.legalForm)
  if (fromForm) return fromForm

  const fromName = companyTypeFromDisplayName(client.fullName || client.name)
  if (fromName) return fromName

  const t = client.companyType
  if (t === 'SA' || t === 'ENI' || t === 'Lda' || t === 'Outro') return t

  return 'Outro'
}
