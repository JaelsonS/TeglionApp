import { Link } from 'react-router-dom'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { cn } from '@/shared/lib/utils'

export function LandingPricing() {
  return (
    <section id="precos" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Preços claros</h2>
          <p className="mt-4 text-[#4A5568]">
            14 dias para experimentar o escritório a sério. Depois escolhe mensal ou anual — sem
            fidelização.
          </p>
        </FadeInView>

        <FadeInStagger className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
          <FadeInStaggerItem>
            <article className="landing-card h-full p-6">
              <p className="text-sm font-medium text-[#4A5568]">Teste grátis</p>
              <p className="mt-2 text-4xl font-semibold text-[#0F2942]">
                0 € <span className="text-lg font-medium text-[#4A5568]">/ 14 dias</span>
              </p>
              <ul className="mt-4 space-y-2 text-[15px] text-[#4A5568]">
                <li>Sem cartão no registo</li>
                <li>Escritório + portal do cliente</li>
                <li>Podes activar o plano quando quiseres</li>
              </ul>
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-6 w-full text-center">
                Começar os 14 dias
              </Link>
            </article>
          </FadeInStaggerItem>

          <FadeInStaggerItem>
            <article className="landing-card h-full p-6">
              <p className="text-sm font-medium text-[#4A5568]">Mensal</p>
              <p className="mt-2 text-4xl font-semibold text-[#0F2942]">
                35 € <span className="text-lg font-medium text-[#4A5568]">/ mês</span>
              </p>
              <p className="mt-1 text-sm text-[#4A5568]">Por escritório · IVA à parte se aplicável</p>
              <ul className="mt-4 space-y-2 text-[15px] text-[#4A5568]">
                <li>Flexível — cancela quando quiseres</li>
                <li>Mesmo produto do teste</li>
              </ul>
              <Link
                to={authFirmRegisterUrl()}
                className="landing-btn-primary mt-6 w-full text-center !bg-white !text-[#0F2942] ring-1 ring-[#0F2942]/20 hover:!bg-[#F7FAFC]"
              >
                Começar com teste grátis
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
                Melhor valor
              </span>
              <p className="text-sm font-medium text-[#0F2942]">Anual</p>
              <p className="mt-2 text-4xl font-semibold text-[#0F2942]">
                29,99 € <span className="text-lg font-medium text-[#4A5568]">/ mês</span>
              </p>
              <p className="mt-1 text-sm text-[#4A5568]">
                Cobrado <strong className="text-[#0F2942]">359,88 € / ano</strong> · por escritório
              </p>
              <ul className="mt-4 space-y-2 text-[15px] text-[#4A5568]">
                <li>Equivalente a ~2 meses grátis vs mensal</li>
                <li>Ideal se já sabes que vais ficar</li>
              </ul>
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-6 w-full text-center">
                Começar com teste grátis
              </Link>
            </article>
          </FadeInStaggerItem>
        </FadeInStagger>

        <p className="mt-6 text-center text-sm text-[#4A5568]">
          O teste de 14 dias continua igual nos dois planos. Sem letras pequenas.
        </p>
      </div>
    </section>
  )
}
