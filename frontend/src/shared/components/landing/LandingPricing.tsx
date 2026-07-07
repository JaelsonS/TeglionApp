import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { cn } from '@/shared/lib/utils'

export function LandingPricing() {
  return (
    <section id="precos" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Preços simples</h2>
          <p className="mt-4 text-[#4A5568]">Experimenta com calma. Paga só se fizer sentido para o escritório.</p>
        </FadeInView>

        <FadeInStagger className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
          <FadeInStaggerItem>
            <article className="landing-card h-full p-6">
              <p className="text-sm font-medium text-[#4A5568]">Teste grátis</p>
              <p className="mt-2 text-4xl font-semibold text-[#0F2942]">
                0 € <span className="text-lg font-medium text-[#4A5568]">/ 14 dias</span>
              </p>
              <ul className="mt-4 space-y-2 text-[15px] text-[#4A5568]">
                <li>Sem cartão</li>
                <li>Acesso completo ao escritório e portal</li>
              </ul>
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-6 w-full text-center">
                Começar teste
              </Link>
            </article>
          </FadeInStaggerItem>

          <FadeInStaggerItem>
            <article
              className={cn(
                'landing-card relative h-full p-6 ring-2 ring-[#0F2942]/15',
                'bg-gradient-to-b from-white to-[#E3F0FF]/30',
              )}
            >
              <span className="absolute -top-3 right-4 rounded-full bg-[#0F2942] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Recomendado
              </span>
              <p className="text-sm font-medium text-[#0F2942]">TegLion</p>
              <p className="mt-2 text-4xl font-semibold text-[#0F2942]">
                29,99 € <span className="block text-base font-medium text-[#4A5568] sm:inline">/ mês por utilizador</span>
              </p>
              <ul className="mt-4 space-y-2 text-[15px] text-[#4A5568]">
                <li>Tudo incluído</li>
                <li>Cancela quando quiseres</li>
              </ul>
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-6 w-full text-center">
                Começar com teste grátis
              </Link>
            </article>
          </FadeInStaggerItem>
        </FadeInStagger>

        <p className="mt-6 text-center text-sm text-[#4A5568]">Sem fidelização. Sem letras pequenas.</p>
      </div>
    </section>
  )
}
