import '@/shared/components/landing/landing.css'
import { useLayoutEffect } from 'react'

import { LandingCtaFinal } from '@/shared/components/landing/LandingCtaFinal'
import { LandingFaq } from '@/shared/components/landing/LandingFaq'
import { LandingFooter } from '@/shared/components/landing/LandingFooter'
import { LandingHeader } from '@/shared/components/landing/LandingHeader'
import { LandingHero } from '@/shared/components/landing/LandingHero'
import { LandingHowItWorks } from '@/shared/components/landing/LandingHowItWorks'
import { LandingPain } from '@/shared/components/landing/LandingPain'
import { LandingPricing } from '@/shared/components/landing/LandingPricing'
import { LandingProof } from '@/shared/components/landing/LandingProof'
import { LandingSalesMaya } from '@/shared/components/landing/LandingSalesMaya'
import { applyPageSeo } from '@/shared/utils/seo'

const FRAUNCES_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,650&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'

function ensureLandingFonts() {
  if (typeof document === 'undefined') return
  const id = 'teglion-landing-fonts'
  if (document.getElementById(id)) return
  const pre1 = document.createElement('link')
  pre1.rel = 'preconnect'
  pre1.href = 'https://fonts.googleapis.com'
  document.head.appendChild(pre1)
  const pre2 = document.createElement('link')
  pre2.rel = 'preconnect'
  pre2.href = 'https://fonts.gstatic.com'
  pre2.crossOrigin = 'anonymous'
  document.head.appendChild(pre2)
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = FRAUNCES_HREF
  document.head.appendChild(link)
}

export function LandingPage() {
  useLayoutEffect(() => {
    ensureLandingFonts()
    applyPageSeo({
      title: 'Teglion | Software SaaS para gabinetes de contabilidade',
      description:
        'Teglion — painel do gabinete, portal do cliente e página pública no mesmo sistema. Documentos, prazos, serviços e pagamentos. 14 dias grátis, sem cartão.',
      path: '/',
    })
  }, [])

  return (
    <div className="landing-page min-h-screen">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingProof />
        <LandingPain />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFaq />
        <LandingCtaFinal />
      </main>
      <LandingFooter />
      <LandingSalesMaya />
    </div>
  )
}
