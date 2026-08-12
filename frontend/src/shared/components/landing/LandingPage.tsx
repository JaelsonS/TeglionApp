import '@/shared/components/landing/landing.css'
import { useLayoutEffect } from 'react'

import { LandingCtaFinal } from '@/shared/components/landing/LandingCtaFinal'
import { LandingFaq } from '@/shared/components/landing/LandingFaq'
import { LandingFeatures } from '@/shared/components/landing/LandingFeatures'
import { LandingFooter } from '@/shared/components/landing/LandingFooter'
import { LandingHeader } from '@/shared/components/landing/LandingHeader'
import { LandingHero } from '@/shared/components/landing/LandingHero'
import { LandingHowItWorks } from '@/shared/components/landing/LandingHowItWorks'
import { LandingPain } from '@/shared/components/landing/LandingPain'
import { LandingPricing } from '@/shared/components/landing/LandingPricing'
import { LandingProductCarousel } from '@/shared/components/landing/LandingProductCarousel'
import { LandingPublicOffer } from '@/shared/components/landing/LandingPublicOffer'
import { LandingSolution } from '@/shared/components/landing/LandingSolution'
import { applyPageSeo } from '@/shared/utils/seo'

export function LandingPage() {
  useLayoutEffect(() => {
    applyPageSeo({
      title: 'Teglion — Um sistema para o escritório de contabilidade',
      description:
        'Documentos, prazos, portal do cliente, página pública, serviços, IRS e pagamentos num só sítio. Feito para escritórios em Portugal. 14 dias grátis, sem cartão.',
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
        <LandingFeatures />
        <LandingPublicOffer />
        <LandingProductCarousel />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFaq />
        <LandingCtaFinal />
      </main>
      <LandingFooter />
    </div>
  )
}
