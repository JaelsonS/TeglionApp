import { useEffect, useRef, useState } from 'react'

import { ADSENSE_LIVE, pickAffiliateForSlot } from '@/features/blog/blogMonetization'
import { BlogAffiliatePromo } from '@/features/blog/components/BlogAffiliatePromo'
import { BlogTeglionPromo } from '@/features/blog/components/BlogTeglionPromo'
import { ADSENSE_CLIENT } from '@/shared/components/ads/BlogAdSense'

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

export type MonetizationKind = 'auto' | 'affiliate' | 'teglion' | 'adsense'

type Props = {
  /** Identificador estável (slug + posição) para rotação de afiliados. */
  seed: string
  kind?: MonetizationKind
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
  adSlot?: string
}

/**
 * Espaço de monetização do blog:
 * - Sem AdSense aprovado: afiliados ou CTA TegLion (sem buracos vazios).
 * - Com VITE_ADSENSE_LIVE=true: tenta AdSense; se não preencher, mostra afiliado.
 */
export function BlogMonetizationSlot({
  seed,
  kind = 'auto',
  format = 'auto',
  className = '',
  adSlot,
}: Props) {
  const resolvedKind = kind === 'auto' ? 'affiliate' : kind
  const affiliate = pickAffiliateForSlot(seed)
  const compact = format === 'horizontal'

  if (resolvedKind === 'teglion') {
    return <BlogTeglionPromo compact={compact} className={className} />
  }

  if (resolvedKind === 'affiliate' || !ADSENSE_LIVE) {
    return <BlogAffiliatePromo item={affiliate} compact={compact} className={className} />
  }

  return (
    <AdSenseWithAffiliateFallback
      seed={seed}
      affiliate={affiliate}
      compact={compact}
      className={className}
      format={format}
      adSlot={adSlot}
    />
  )
}

function AdSenseWithAffiliateFallback({
  seed,
  affiliate,
  compact,
  className,
  format,
  adSlot,
}: {
  seed: string
  affiliate: ReturnType<typeof pickAffiliateForSlot>
  compact: boolean
  className: string
  format: 'auto' | 'rectangle' | 'horizontal'
  adSlot?: string
}) {
  const pushed = useRef(false)
  const insRef = useRef<HTMLModElement>(null)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (pushed.current || !insRef.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      setShowFallback(true)
    }
  }, [])

  useEffect(() => {
    const node = insRef.current
    if (!node) return

    const timer = window.setTimeout(() => {
      const filled = node.offsetHeight > 24 && node.getAttribute('data-ad-status') !== 'unfilled'
      if (!filled) setShowFallback(true)
    }, 2800)

    const observer = new MutationObserver(() => {
      if (node.offsetHeight > 24 && node.getAttribute('data-ad-status') !== 'unfilled') {
        setShowFallback(false)
      }
    })
    observer.observe(node, { attributes: true, childList: true, subtree: true })

    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
    }
  }, [seed])

  if (showFallback) {
    return <BlogAffiliatePromo item={affiliate} compact={compact} className={className} />
  }

  return (
    <aside className={`blog-monetization-slot ${className}`.trim()} aria-label="Publicidade">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center', width: '100%' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-format={format}
        data-full-width-responsive="true"
        {...(adSlot ? { 'data-ad-slot': adSlot } : {})}
      />
    </aside>
  )
}
