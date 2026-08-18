import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'

/**
 * Identidade jurídica do prestador.
 * Teglion = marca do produto. AfDigital = quem opera. Titular = pessoa confirmada
 * (não inventar NIF / razão social de sociedade para a AfDigital).
 */
export const CONTABIL_LEGAL_OPERATOR = {
  brand: BRAND.name,
  tradingName: AGENCY.displayName,
  legalName: 'Jaelson Silva dos Santos',
  nif: '331 759 276',
  nifRaw: '331759276',
  cae: '62100 — Atividades de programação informática',
  address: 'Coimbra, Portugal',
  email: BRAND.emails.hello,
  phone: BRAND.phone.display,
  supportEmail: BRAND.emails.support,
  jurisdiction: 'Portugal / União Europeia',
} as const
