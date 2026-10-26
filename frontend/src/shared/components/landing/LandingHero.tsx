import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_SCREENS } from '@/shared/components/landing/landingScreens'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { BRAND } from '@/shared/config/brand'

export function LandingHero() {
  const reduce = useReducedMotion()

  const scrollToProof = () => {
    document.getElementById('produto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="landing-hero" aria-labelledby="landing-hero-brand">
      <div className="landing-hero-inner">
        <div className="landing-hero-animate max-w-2xl pt-6 sm:pt-10 lg:pt-14">
          <p id="landing-hero-brand" className="landing-hero-brand">
            {BRAND.name}
          </p>
          <h1 className="landing-hero-headline mt-5 sm:mt-6">
            Software SaaS para o seu gabinete de contabilidade.
          </h1>
          <p className="landing-hero-support mt-4 sm:mt-5">
            Painel da equipa, portal do cliente e página pública no mesmo sistema — documentos,
            prazos, serviços e pagamentos sem saltar de ferramenta.
          </p>
          <div className="mt-7 flex w-full flex-col items-stretch gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <Link to={authFirmRegisterUrl()} className="landing-btn-primary w-full sm:w-auto">
              Testar 14 dias grátis
            </Link>
            <button
              type="button"
              onClick={scrollToProof}
              className="landing-btn-ghost landing-btn-ghost-light py-2 text-center sm:text-left"
            >
              Ver o produto
            </button>
          </div>
          <p className="mt-4 text-[13px] text-white/55 sm:text-sm">
            Sem cartão · Sem fidelização · Cancela quando quiser
          </p>
        </div>

        <motion.div
          className="landing-hero-visual"
          initial={reduce ? undefined : { opacity: 0, y: 32 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
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
