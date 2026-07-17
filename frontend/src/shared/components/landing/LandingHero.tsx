import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_SCREENS } from '@/shared/components/landing/landingScreens'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInView } from '@/shared/components/landing/FadeInView'

export function LandingHero() {
  const reduce = useReducedMotion()

  const scrollToProduct = () => {
    document.getElementById('produto')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="landing-section pt-28 lg:pt-32">
      <div className="landing-container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeInView>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C9932E]">
              Para escritórios de contabilidade
            </p>
            <h1 className="mt-3 max-w-xl text-[2.35rem] font-semibold leading-[1.1] text-[#0F2942] sm:text-5xl lg:text-[3.4rem]">
              Fecha o mês sem caçar documentos no WhatsApp.
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-[#4A5568]">
              Pedidos de documentos, prazos fiscais e conversas com o cliente — num só sistema. A
              equipa sabe o que falta; o cliente sabe o que entregar.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary px-8 py-3.5">
                Quero testar 14 dias grátis
              </Link>
              <button
                type="button"
                onClick={scrollToProduct}
                className="text-sm font-medium text-[#0F2942]/75 underline-offset-4 hover:text-[#0F2942] hover:underline"
              >
                Ver o produto
              </button>
            </div>
            <p className="mt-4 text-sm text-[#4A5568]">
              Sem cartão. Escritório completo desde o primeiro dia. Cancele quando quiser.
            </p>
          </FadeInView>

          <motion.div
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
            style={reduce ? undefined : { perspective: 1200 }}
            initial={reduce ? undefined : { opacity: 0, y: 24, rotateY: -4 }}
            animate={reduce ? undefined : { opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="transform-gpu"
              style={reduce ? undefined : { transform: 'rotateY(-6deg) rotateX(2deg)' }}
            >
              <LandingScreenshot
                src={LANDING_SCREENS.dashboard}
                alt="Painel do escritório no TegLion"
                priority
                className="shadow-[0_20px_50px_rgba(15,41,66,0.12)]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
