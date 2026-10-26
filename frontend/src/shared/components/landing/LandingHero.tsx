import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { LANDING_ANCHORS } from '@/shared/constants/landingAnchors'

export function LandingHero() {
  const reduce = useReducedMotion()

  return (
    <section className="landing-hero landing-hero--centered" aria-labelledby="landing-hero-title">
      <div className="landing-hero-inner landing-hero-inner--centered">
        <motion.div
          className="landing-hero-copy"
          initial={reduce ? undefined : { opacity: 0, y: 18 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="landing-hero-brand">
            Teglion<span className="landing-hero-brand-dot" aria-hidden />
          </p>
          <h1 id="landing-hero-title" className="landing-hero-headline landing-hero-headline--centered">
            Gabinete, portal do cliente e página pública — a mesma operação.
          </h1>
          <p className="landing-hero-support landing-hero-support--centered">
            Documentos, prazos, serviços, IRS, agenda, carteira e comunicação no mesmo sistema. A
            equipa trabalha no painel; o cliente entrega no portal; a oferta vive no site.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link to={authFirmRegisterUrl()} className="landing-btn-primary landing-btn-primary--arrow">
              Testar 14 dias grátis
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <a href={LANDING_ANCHORS.produto} className="landing-btn-secondary-light">
              Ver o produto
            </a>
          </div>
          <p className="landing-hero-trust landing-hero-trust--centered">
            Sem cartão · Sem fidelização · Cancela quando quiser
          </p>
        </motion.div>

        <motion.div
          className="landing-hero-visual landing-hero-visual--lifestyle"
          initial={reduce ? undefined : { opacity: 0, y: 32 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src="/landing/screens/hero-lifestyle.jpg"
            alt="Teglion no desktop, tablet e telemóvel — painel, portal e página pública"
            className="landing-hero-lifestyle-img"
            width={1920}
            height={1088}
            fetchPriority="high"
          />
          <div className="landing-hero-fade" aria-hidden />
        </motion.div>
      </div>
    </section>
  )
}
