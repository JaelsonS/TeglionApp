import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_SCREENS } from '@/shared/components/landing/landingScreens'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'

export function LandingHero() {
  const reduce = useReducedMotion()

  const scrollToProof = () => {
    document.getElementById('produto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero-inner">
        <div className="landing-hero-animate max-w-xl pt-8 sm:max-w-2xl sm:pt-12 lg:pt-16">
          <p className="landing-hero-kicker">Para gabinetes de contabilidade em Portugal</p>
          <h1 id="landing-hero-title" className="landing-hero-headline mt-4 sm:mt-5">
            Gabinete, portal e página pública — a mesma operação.
          </h1>
          <p className="landing-hero-support mt-4 sm:mt-5">
            Documentos, prazos, serviços e pagamentos no mesmo sistema. A equipa trabalha no painel;
            o cliente entrega no portal; a oferta vive no site.
          </p>
          <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <Link to={authFirmRegisterUrl()} className="landing-btn-primary w-full sm:w-auto">
              Testar 14 dias grátis
            </Link>
            <button
              type="button"
              onClick={scrollToProof}
              className="landing-btn-secondary-light w-full sm:w-auto"
            >
              Ver o produto
            </button>
          </div>
          <p className="landing-hero-trust mt-5">
            Sem cartão · Sem fidelização · Cancela quando quiser
          </p>
        </div>

        <motion.div
          className="landing-hero-visual"
          initial={reduce ? undefined : { opacity: 0, y: 28 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <LandingScreenshot
            src={LANDING_SCREENS.dashboard}
            alt="Painel Teglion do gabinete de contabilidade"
            priority
          />
          <div className="landing-hero-fade" aria-hidden />
        </motion.div>
      </div>
    </section>
  )
}
