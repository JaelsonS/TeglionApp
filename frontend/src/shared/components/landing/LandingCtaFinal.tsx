import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInView } from '@/shared/components/landing/FadeInView'

export function LandingCtaFinal() {
  return (
    <section className="landing-section !py-0">
      <FadeInView className="landing-container">
        <div className="landing-cta-panel rounded-[14px] bg-gradient-to-br from-[#0F2942] via-[#153552] to-[#1a3a5c] px-8 py-16 text-center sm:px-14 sm:py-20">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Pronto para o próximo fecho de mês com menos stress?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
            Crie a conta, convide um cliente e veja o ciclo completo — pedidos, entregas e prazos —
            durante 14 dias, sem cartão.
          </p>
          <Link
            to={authFirmRegisterUrl()}
            className="landing-btn-primary mt-8 inline-flex bg-white px-10 py-3.5 text-[#0F2942] hover:bg-[#FAFAF7] hover:scale-[1.02]"
          >
            Começar o teste gratuito
          </Link>
          <p className="mt-4 text-sm text-white/65">Sem compromisso. Cancele quando quiser.</p>
        </div>
      </FadeInView>
    </section>
  )
}
