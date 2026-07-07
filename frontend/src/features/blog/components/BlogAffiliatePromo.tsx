import type { AffiliatePick } from '@/features/blog/blogMonetization'

type Props = {
  item: AffiliatePick
  compact?: boolean
  className?: string
}

export function BlogAffiliatePromo({ item, compact = false, className = '' }: Props) {
  const isAmazon = item.url.includes('amzn.to') || item.url.includes('amazon.')
  const partner = isAmazon ? 'Amazon' : 'Hotmart'

  return (
    <a
      href={item.url}
      className={`blog-promo blog-promo--affiliate ${compact ? 'blog-promo--compact' : ''} ${className}`.trim()}
      rel="noopener noreferrer sponsored"
      target="_blank"
    >
      <span className="blog-promo-eyebrow">Recomendado · {partner}</span>
      <span className="blog-promo-title">{item.label}</span>
      <span className="blog-promo-cta">{item.ctaLabel} →</span>
      <span className="blog-promo-disclosure">
        Link de afiliado — podemos receber comissão sem custo extra para si.
        {isAmazon ? ' Como Afiliado da Amazon, ganhamos por compras elegíveis.' : ''}
      </span>
    </a>
  )
}
