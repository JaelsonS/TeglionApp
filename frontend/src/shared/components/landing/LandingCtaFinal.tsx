import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInView } from '@/shared/components/landing/FadeInView'

export function LandingCtaFinal() {
  return (
    <section className="landing-section !py-0">
      <FadeInView className="landing-container">
        <div className="landing-cta-panel rounded-[14px] bg-gradient-to-br from-[#0F2942] via-[#153552] to-[#1a3a5c] px-8 py-16 text-center sm:px-14 sm:py-20">
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Pronto para fechar o próximo mês sem stress?
          </h2>
          <Link
            to={authFirmRegisterUrl()}
            className="landing-btn-primary mt-8 inline-flex bg-white px-10 py-3.5 text-[#0F2942] hover:bg-[#FAFAF7] hover:scale-[1.02]"
          >
            Começar 14 dias grátis
          </Link>
          <p className="mt-4 text-sm text-white/70">Sem cartão. Sem compromisso.</p>
        </div>
      </FadeInView>
    </section>
  )
}
