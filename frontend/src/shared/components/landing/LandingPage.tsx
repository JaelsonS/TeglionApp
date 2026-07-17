import '@/shared/components/landing/landing.css'
import { useLayoutEffect } from 'react'

import { LandingBenefits } from '@/shared/components/landing/LandingBenefits'
import { LandingCtaFinal } from '@/shared/components/landing/LandingCtaFinal'
import { LandingFaq } from '@/shared/components/landing/LandingFaq'
import { LandingFooter } from '@/shared/components/landing/LandingFooter'
import { LandingHeader } from '@/shared/components/landing/LandingHeader'
import { LandingHero } from '@/shared/components/landing/LandingHero'
import { LandingHowItWorks } from '@/shared/components/landing/LandingHowItWorks'
import { LandingPain } from '@/shared/components/landing/LandingPain'
import { LandingPricing } from '@/shared/components/landing/LandingPricing'
import { LandingProductCarousel } from '@/shared/components/landing/LandingProductCarousel'
import { LandingSocialProof } from '@/shared/components/landing/LandingSocialProof'
import { LandingSolution } from '@/shared/components/landing/LandingSolution'
import { applyPageSeo } from '@/shared/utils/seo'

export function LandingPage() {
  useLayoutEffect(() => {
    applyPageSeo({
      title: 'TegLion — Fecha o mês sem caçar documentos no WhatsApp',
      description:
        'Sistema para escritórios de contabilidade em Portugal: pedidos de documentos, prazos fiscais e portal do cliente num só sítio. 14 dias grátis, sem cartão.',
      path: '/',
    })
  }, [])

  return (
    <div className="landing-page min-h-screen">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingPain />
        <LandingSolution />
        <LandingProductCarousel />
        <LandingSocialProof />
        <LandingBenefits />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFaq />
        <LandingCtaFinal />
      </main>
      <LandingFooter />
    </div>
  )
}
