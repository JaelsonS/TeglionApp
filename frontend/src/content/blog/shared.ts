import { AFFILIATE_LINKS, type AffiliateKey } from '@/content/blog/affiliates'
import type { BlogBlock } from '@/content/blog/types'
import { BRAND } from '@/shared/config/brand'

export const AFFILIATE_PLACEHOLDER_HREF = BRAND.url

export const LEGAL_DISCLAIMER =
  'Este artigo é apenas informativo e educativo. Não substitui aconselhamento fiscal, contabilístico ou jurídico personalizado. Para a sua situação concreta, consulte sempre um contador certificado (OCC) ou outro profissional habilitado.'

export const AFFILIATE_DISCLOSURE =
  'Alguns links neste artigo são de afiliado (Hotmart, Amazon, etc.). Podemos receber comissão se comprar — sem custo extra para si. Só recomendamos recursos alinhados com o tema do artigo.'

function affiliateLabel(title: string) {
  return title
    .replace(/\s*\(Amazon\)\s*$/i, '')
    .replace(/\s*\(Hotmart\)\s*$/i, '')
    .replace(/\s*—\s*.*$/, '')
    .trim()
}

/**
 * Uma recomendação em prosa (no meio do texto), nunca um card empilhado.
 */
export function affiliateBlock(input: {
  key: AffiliateKey
  leadIn: string
  title: string
  description: string
  image?: { src: string; alt: string }
  ctaLabel?: string
}): BlogBlock {
  const link = AFFILIATE_LINKS[input.key]
  const label = affiliateLabel(input.title)
  return {
    type: 'p',
    text: `${input.leadIn} Na prática, [${label}](${link.url}) costuma ser a escolha mais directa: ${input.description}`,
  }
}

/**
 * Secção de recomendação editorial: contexto → 1–2 menções inline → CTA final persuasivo.
 * Ignora itens além do 2.º (acabam com o “catálogo feio”).
 */
export function affiliateSection(input: {
  heading: string
  headingId?: string
  intro: string
  items: Array<Parameters<typeof affiliateBlock>[0]>
}): BlogBlock[] {
  const primary = input.items[0]
  const secondary = input.items[1]
  if (!primary) return []

  const primaryLink = AFFILIATE_LINKS[primary.key]
  const primaryLabel = affiliateLabel(primary.title)
  const blocks: BlogBlock[] = [
    { type: 'h2', id: input.headingId, text: input.heading },
    {
      type: 'p',
      text: input.intro.replace(/\s*Links? de afiliado[^.]*\./gi, '').trim() || input.intro,
    },
    {
      type: 'p',
      text: `${primary.leadIn} Se quiser uma solução concreta e pronta a usar, veja [${primaryLabel}](${primaryLink.url}) — ${primary.description}`,
    },
  ]

  if (secondary) {
    const secondaryLink = AFFILIATE_LINKS[secondary.key]
    const secondaryLabel = affiliateLabel(secondary.title)
    blocks.push({
      type: 'p',
      text: `Para complementar o mesmo fluxo de trabalho: ${secondary.leadIn} Muitos leitores optam por [${secondaryLabel}](${secondaryLink.url}). ${secondary.description}`,
    })
  }

  blocks.push({
    type: 'callout',
    variant: 'tip',
    title: 'Próximo passo (recomendação)',
    text: `Se for investir só numa peça depois de ler este guia, comece por [${primaryLabel}](${primaryLink.url}). Resolve o problema mais comum deste tema e evita comprar “à toa”. ${AFFILIATE_DISCLOSURE}`,
  })

  return blocks
}

export function internalLinksSection(input: {
  title: string
  intro?: string
  slugs: string[]
}) {
  const blocks: BlogBlock[] = [
    {
      type: 'internalLinks',
      title: input.title,
      intro: input.intro,
      slugs: input.slugs,
    },
  ]
  return blocks
}

/** CTA TegLion no meio do artigo (escritório ou portal cliente). */
export function teglionCtaBlock(input: {
  variant: 'firm' | 'client'
  title?: string
  text?: string
}) {
  return {
    type: 'teglionCta' as const,
    variant: input.variant,
    title: input.title,
    text: input.text,
  }
}

export function quoteBlock(text: string, attribution?: string) {
  return { type: 'quote' as const, text, attribution }
}

/** Resumo executivo no topo do artigo — leitura rápida antes do fundo. */
export function keyTakeaways(items: string[], title = 'O essencial em 60 segundos') {
  return { type: 'keyTakeaways' as const, title, items }
}

export function proseParagraphs(...texts: string[]): BlogBlock[] {
  return texts.map((text) => ({ type: 'p' as const, text }))
}

export function comparisonTable(input: {
  caption?: string
  headers: string[]
  rows: string[][]
}) {
  return { type: 'table' as const, ...input }
}

export function sectionDivider() {
  return { type: 'divider' as const }
}

/** Secção com h2 + parágrafos + blocos extra. */
export function articleSection(input: {
  h2: string
  id?: string
  paragraphs?: string[]
  blocks?: BlogBlock[]
}): BlogBlock[] {
  const out: BlogBlock[] = [{ type: 'h2', id: input.id, text: input.h2 }]
  if (input.paragraphs?.length) out.push(...proseParagraphs(...input.paragraphs))
  if (input.blocks?.length) out.push(...input.blocks)
  return out
}

export function legalCallout(extra?: string) {
  return {
    type: 'callout' as const,
    variant: 'legal' as const,
    title: 'Aviso importante',
    text: extra ? `${LEGAL_DISCLAIMER} ${extra}` : LEGAL_DISCLAIMER,
  }
}

/** Secção FAQ — alimenta schema FAQPage no SEO. */
export function faqSection(input: {
  heading?: string
  headingId?: string
  items: { question: string; answer: string }[]
}) {
  const blocks: BlogBlock[] = []
  if (input.heading) {
    blocks.push({ type: 'h2', id: input.headingId || 'faq', text: input.heading })
  }
  blocks.push({
    type: 'faq',
    id: input.headingId || 'faq',
    heading: input.heading,
    items: input.items,
  })
  return blocks
}
