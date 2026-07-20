import { Link } from 'react-router-dom'

import { AFFILIATE_LINKS, type AffiliateKey } from '@/content/blog/affiliates'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { trackBlogEvent } from '@/features/blog/blogAnalytics'

export type BlogShelfProduct = {
  key: string
  href: string
  title: string
  blurb: string
  imageSrc: string
  badge?: string
  external?: boolean
}

const AFFILIATE_SHELF: Array<{ key: AffiliateKey; blurb: string; image: string; badge?: string }> = [
  {
    key: 'hotmartIrsReciboVerde',
    blurb: 'Guia prático IRS + recibos verdes',
    image: '/blog/products/prod-irs-guide.svg',
    badge: 'Hotmart',
  },
  {
    key: 'amazonAgendaBezend',
    blurb: 'Agenda 2026–2027 para prazos fiscais',
    image: '/blog/products/prod-agenda.svg',
    badge: 'Amazon',
  },
  {
    key: 'amazonPastaThinkTex26',
    blurb: 'Arquivo A4 — documentos à mão',
    image: '/blog/products/prod-pasta.svg',
    badge: 'Amazon',
  },
  {
    key: 'amazonCasio991',
    blurb: 'Calculadora científica fiável',
    image: '/blog/products/prod-calc.svg',
    badge: 'Amazon',
  },
  {
    key: 'amazonBitdefender',
    blurb: 'Segurança para dados fiscais',
    image: '/blog/products/prod-security.svg',
    badge: 'Amazon',
  },
  {
    key: 'amazonM365Pessoal',
    blurb: 'OneDrive + Office para o escritório',
    image: '/blog/products/prod-office.svg',
    badge: 'Amazon',
  },
]

function buildAffiliateProducts(): BlogShelfProduct[] {
  return AFFILIATE_SHELF.map((item) => {
    const link = AFFILIATE_LINKS[item.key]
    return {
      key: item.key,
      href: link.url,
      title: link.label.replace(/\s*\(Amazon\)\s*$/i, '').split('–')[0].trim(),
      blurb: item.blurb,
      imageSrc: item.image,
      badge: item.badge,
      external: true,
    }
  })
}

type Props = {
  /** Variante compacta para rail do artigo */
  compact?: boolean
}

export function BlogProductShelf({ compact = false }: Props) {
  const products = buildAffiliateProducts().slice(0, compact ? 2 : 3)

  return (
    <aside className="blog-product-shelf" aria-label="Recursos e produtos recomendados">
      <p className="blog-rail-eyebrow">Recomendado</p>
      <p className="blog-rail-title">Uma ferramenta útil para este tema</p>
      <p className="blog-rail-text mt-1.5">
        Sugestões pontuais (não um catálogo). Links de afiliado — comissão sem custo extra para si.
      </p>

      <ul className="blog-product-list mt-3">
        <li>
          <Link
            to={authFirmRegisterUrl()}
            className="blog-product-card"
            onClick={() => trackBlogEvent('blog_product_click', { product: 'teglion-trial' })}
          >
            <img src="/blog/products/prod-teglion.svg" alt="" width={72} height={54} loading="lazy" />
            <span>
              <span className="blog-product-card-title">TegLion — teste 14 dias</span>
              <span className="blog-product-card-blurb">Portal, documentos e prazos do escritório</span>
            </span>
          </Link>
        </li>
        {products.map((p) => (
          <li key={p.key}>
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="blog-product-card"
              onClick={() => trackBlogEvent('blog_product_click', { product: p.key })}
            >
              <img src={p.imageSrc} alt="" width={72} height={54} loading="lazy" />
              <span>
                <span className="blog-product-card-title">
                  {p.badge ? <span className="blog-product-badge">{p.badge}</span> : null}
                  {shortTitle(p.title)}
                </span>
                <span className="blog-product-card-blurb">{p.blurb}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function shortTitle(title: string) {
  return title.length > 42 ? `${title.slice(0, 40)}…` : title
}
