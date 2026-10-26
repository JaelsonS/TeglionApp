import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInView } from '@/shared/components/landing/FadeInView'

export function LandingCtaFinal() {
  return (
    <section className="landing-section !py-0 pb-12 sm:pb-16">
      <FadeInView className="landing-container">
        <div className="landing-cta-panel px-8 py-14 text-center sm:px-14 sm:py-16">
          <h2 className="text-3xl leading-tight text-white sm:text-4xl md:text-[2.75rem]">
            Põe o gabinete inteiro no mesmo sistema.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70 sm:text-base">
            14 dias com o produto completo. Sem cartão, sem fidelização. Preços promocionais de
            lançamento — quem aderir agora mantém o valor enquanto a conta estiver activa.
          </p>
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-8 inline-flex px-10">
            Começar o teste gratuito
          </Link>
          <p className="mt-4 text-sm text-white/50">Sem compromisso. Cancela quando quiser.</p>
        </div>
      </FadeInView>
    </section>
  )
}
