import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInView } from '@/shared/components/landing/FadeInView'

export function LandingCtaFinal() {
  return (
    <section className="landing-section !py-0 pb-12 sm:pb-16">
      <FadeInView className="landing-container">
        <div className="landing-cta-panel px-8 py-14 text-center sm:px-14 sm:py-16">
          <h2 className="text-3xl leading-tight text-white sm:text-4xl md:text-[2.75rem]">
            Comece a vender e a operar no Teglion esta semana
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base">
            Crie a conta, publique a página, configure serviços e convide um cliente. 14 dias
            grátis — sem cartão, sem fidelização.
          </p>
          <Link
            to={authFirmRegisterUrl()}
            className="landing-btn-primary mt-8 inline-flex px-10"
          >
            Começar o teste gratuito agora
          </Link>
          <p className="mt-4 text-sm text-white/50">Sem compromisso. Cancela quando quiser.</p>
        </div>
      </FadeInView>
    </section>
  )
}
