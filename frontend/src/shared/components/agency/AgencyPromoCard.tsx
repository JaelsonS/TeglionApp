import { ExternalLink, Sparkles } from 'lucide-react'

import { AGENCY } from '@/shared/config/agency'
import { trackProductEvent } from '@/shared/utils/productAnalytics'

/** Bloco suave B2B no painel do escritório. */
export function AgencyPromoCard() {
  return (
    <section className="cb-dash-panel">
      <div className="cb-dash-panel-hd">
        <span className="cb-dash-panel-title flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden />
          {AGENCY.promoTitle}
        </span>
      </div>
      <p className="px-3.5 text-sm text-muted-foreground">{AGENCY.promoBody}</p>
      <a
        href={AGENCY.url}
        target="_blank"
        rel="noopener noreferrer"
        className="cb-dash-sc mx-3.5 mb-3 mt-2 inline-flex items-center gap-1.5"
        onClick={() => trackProductEvent('agency_click', { surface: 'firm', placement: 'promo' })}
      >
        {AGENCY.promoCta}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </section>
  )
}
