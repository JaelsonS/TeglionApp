import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'

/** Mensagem pré-preenchida no WhatsApp de suporte Teglion. */
export const SUPPORT_WHATSAPP_PREFILL = 'Olá, preciso de ajuda com o Teglion.'

/** Assunto padrão do mailto de suporte. */
export const SUPPORT_EMAIL_SUBJECT = 'Suporte Teglion'

/** Linha institucional curta (produto + empresa). */
export function teglionProductOfAgencyLine(): string {
  return `${BRAND.name} · ${AGENCY.productOfLabel}`
}

/** URL WhatsApp Web/app com texto opcional (usa `BRAND.phone.whatsapp`). */
export function whatsappSupportUrl(message: string = SUPPORT_WHATSAPP_PREFILL): string {
  const base = String(BRAND.phone.whatsapp || '').trim()
  if (!base) return ''
  const text = String(message || '').trim()
  if (!text) return base
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}text=${encodeURIComponent(text)}`
}

/** mailto: para o email oficial de suporte. */
export function mailtoSupportUrl(subject: string = SUPPORT_EMAIL_SUBJECT): string {
  const email = String(BRAND.emails.support || '').trim()
  if (!email) return ''
  const sub = String(subject || '').trim()
  if (!sub) return `mailto:${email}`
  return `mailto:${email}?subject=${encodeURIComponent(sub)}`
}

/** tel: com o número oficial (E.164). */
export function telSupportUrl(): string {
  const e164 = String(BRAND.phone.e164 || '').trim()
  return e164 ? `tel:${e164}` : ''
}

export function supportPhoneDisplay(): string {
  return BRAND.phone.display
}

export function supportEmailDisplay(): string {
  return BRAND.emails.support
}

export function agencyWebsiteUrl(): string {
  return AGENCY.url
}

export function agencySocialUrl(id: keyof typeof AGENCY.socials): string {
  return AGENCY.socials[id]
}
