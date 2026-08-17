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
import { LandingTrust } from '@/shared/components/landing/LandingTrust'
import { LandingSalesMaya } from '@/shared/components/landing/LandingSalesMaya'
import { applyPageSeo } from '@/shared/utils/seo'

export function LandingPage() {
  useLayoutEffect(() => {
    applyPageSeo({
      title: 'Teglion — Plataforma para escritórios de contabilidade',
      description:
        'Teglion é uma plataforma de gestão para escritórios de contabilidade, desenvolvida e operada pela AfDigital — Soluções Tecnológicas. Documentos, prazos, portal, serviços e pagamentos num só sítio. 14 dias grátis.',
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
        <LandingTrust />
        <LandingFaq />
        <LandingCtaFinal />
      </main>
      <LandingFooter />
      <LandingSalesMaya />
    </div>
  )
}
