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
    <section className="landing-section pt-24 sm:pt-28 lg:pt-32">
      <div className="landing-container">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeInView>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C9932E]">
              Para escritórios de contabilidade
            </p>
            <h1 className="mt-3 max-w-xl text-[1.85rem] font-semibold leading-[1.12] text-[#0F2942] sm:text-[2.35rem] md:text-5xl lg:text-[3.4rem]">
              Fecha o mês sem caçar documentos no WhatsApp.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#4A5568] sm:mt-5 sm:text-[17px]">
              Pedidos de documentos, prazos fiscais e conversas com o cliente — num só sistema. A
              equipa sabe o que falta; o cliente sabe o que entregar.
            </p>
            <div className="mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary w-full px-6 py-3.5 sm:w-auto sm:px-8">
                Quero testar 14 dias grátis
              </Link>
              <button
                type="button"
                onClick={scrollToProduct}
                className="py-2 text-center text-sm font-medium text-[#0F2942]/75 underline-offset-4 hover:text-[#0F2942] hover:underline sm:text-left"
              >
                Ver o produto
              </button>
            </div>
            <p className="mt-4 text-[13px] text-[#4A5568] sm:text-sm">
              Sem cartão. Escritório completo desde o primeiro dia. Também como app (PWA) no telemóvel.
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
                alt="Painel do escritório no Teglion"
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
