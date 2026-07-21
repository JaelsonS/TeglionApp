import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { blogPostUrl } from '@/content/blog/blog-paths'

/** Domínios oficiais / úteis — aparecem no texto sem https e passam a ser clicáveis. */
export const BLOG_KNOWN_DOMAINS: Record<string, { href: string; label?: string }> = {
  'portaldasfinancas.gov.pt': { href: 'https://www.portaldasfinancas.gov.pt/' },
  'www.portaldasfinancas.gov.pt': { href: 'https://www.portaldasfinancas.gov.pt/' },
  'seguranca-social.pt': { href: 'https://www.seg-social.pt/' },
  'www.seguranca-social.pt': { href: 'https://www.seg-social.pt/' },
  'seg-social.pt': { href: 'https://www.seg-social.pt/' },
  'www.seg-social.pt': { href: 'https://www.seg-social.pt/' },
  'autenticacao.gov.pt': { href: 'https://www.autenticacao.gov.pt/' },
  'www.autenticacao.gov.pt': { href: 'https://www.autenticacao.gov.pt/' },
  'eportugal.gov.pt': { href: 'https://eportugal.gov.pt/' },
  'www.eportugal.gov.pt': { href: 'https://eportugal.gov.pt/' },
  'occ.pt': { href: 'https://www.occ.pt/' },
  'www.occ.pt': { href: 'https://www.occ.pt/' },
  'teglion.com': { href: 'https://www.teglion.com/' },
  'www.teglion.com': { href: 'https://www.teglion.com/' },
}

const MARKDOWN_LINK =
  /\[([^\]]+)\]\(([^)\s]+)\)/g

const BARE_URL =
  /https?:\/\/[^\s)\]>"']+/gi

const DOMAIN_PATTERN = new RegExp(
  `\\b(?:${Object.keys(BLOG_KNOWN_DOMAINS)
    .map((d) => d.replace(/\./g, '\\.'))
    .join('|')})\\b`,
  'gi',
)

const linkClass =
  'font-medium blog-text-navy underline underline-offset-4 hover:blog-text-gold break-words'

function isAffiliateOrPaid(href: string) {
  return /hotmart|amzn\.to|amazon\.|go\.hotmart/i.test(href)
}

function externalRel(href: string) {
  return isAffiliateOrPaid(href) ? 'noopener noreferrer sponsored' : 'noopener noreferrer'
}

function ExternalA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel={externalRel(href)} className={linkClass}>
      {children}
    </a>
  )
}

/**
 * Transforma texto do blog em nós React com links clicáveis:
 * - `[rótulo](https://…)` — externo
 * - `[rótulo](/blog/slug)` ou `[rótulo](slug:meu-artigo)` — interno
 * - URLs https://… soltas
 * - Domínios conhecidos (portaldasfinancas.gov.pt, seguranca-social.pt, …)
 */
export function linkifyBlogText(text: string): ReactNode {
  if (!text) return text

  // 1) Partir por markdown [label](target)
  const parts: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  const md = new RegExp(MARKDOWN_LINK.source, 'g')
  let mdIndex = 0

  while ((m = md.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(...linkifyPlainChunk(text.slice(last, m.index), `p${mdIndex}`))
    }
    const label = m[1]
    const target = m[2]
    parts.push(renderMarkdownTarget(label, target, `md${mdIndex}`))
    last = m.index + m[0].length
    mdIndex += 1
  }
  if (last < text.length) {
    parts.push(...linkifyPlainChunk(text.slice(last), `t${mdIndex}`))
  }

  return parts.length === 1 ? parts[0] : parts
}

function renderMarkdownTarget(label: string, target: string, key: string): ReactNode {
  if (target.startsWith('slug:')) {
    const slug = target.slice(5)
    return (
      <Link key={key} to={blogPostUrl(slug)} className={linkClass}>
        {label}
      </Link>
    )
  }
  if (target.startsWith('/blog/') || target.startsWith('/')) {
    return (
      <Link key={key} to={target} className={linkClass}>
        {label}
      </Link>
    )
  }
  if (/^https?:\/\//i.test(target)) {
    return (
      <ExternalA key={key} href={target}>
        {label}
      </ExternalA>
    )
  }
  // Domínio sem protocolo
  const known = BLOG_KNOWN_DOMAINS[target.toLowerCase()]
  if (known) {
    return (
      <ExternalA key={key} href={known.href}>
        {label}
      </ExternalA>
    )
  }
  return label
}

function linkifyPlainChunk(chunk: string, keyPrefix: string): ReactNode[] {
  if (!chunk) return []

  // Combinar bare URLs + known domains numa passagem por índices
  type Hit = { start: number; end: number; href: string; label: string }
  const hits: Hit[] = []

  const urlRe = new RegExp(BARE_URL.source, 'gi')
  let um: RegExpExecArray | null
  while ((um = urlRe.exec(chunk)) !== null) {
    let href = um[0]
    // trim trailing punctuation
    href = href.replace(/[.,;:!?)]+$/, '')
    hits.push({ start: um.index, end: um.index + href.length, href, label: href })
  }

  const domRe = new RegExp(DOMAIN_PATTERN.source, 'gi')
  let dm: RegExpExecArray | null
  while ((dm = domRe.exec(chunk)) !== null) {
    const raw = dm[0]
    const known = BLOG_KNOWN_DOMAINS[raw.toLowerCase()]
    if (!known) continue
    // skip if already inside a bare URL hit
    const start = dm.index
    const end = start + raw.length
    if (hits.some((h) => start >= h.start && end <= h.end)) continue
    hits.push({ start, end, href: known.href, label: raw })
  }

  hits.sort((a, b) => a.start - b.start)

  // remove overlaps (prefer earlier / longer)
  const filtered: Hit[] = []
  let cursor = 0
  for (const h of hits) {
    if (h.start < cursor) continue
    filtered.push(h)
    cursor = h.end
  }

  if (!filtered.length) return [chunk]

  const out: ReactNode[] = []
  let i = 0
  filtered.forEach((h, idx) => {
    if (h.start > i) out.push(chunk.slice(i, h.start))
    out.push(
      <ExternalA key={`${keyPrefix}-${idx}`} href={h.href}>
        {h.label}
      </ExternalA>,
    )
    i = h.end
  })
  if (i < chunk.length) out.push(chunk.slice(i))
  return out
}
