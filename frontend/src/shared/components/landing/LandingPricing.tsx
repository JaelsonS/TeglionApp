import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { cn } from '@/shared/lib/utils'

const PLANS = [
  {
    id: 'trial',
    name: 'Teste grátis',
    price: '0 €',
    period: '/ 14 dias',
    note: 'Sem cartão no registo',
    features: ['Escritório + portal do cliente', 'Utilizadores ilimitados no trial', 'PWA no telemóvel e computador'],
    cta: 'Começar os 14 dias',
    primary: true,
    featured: false,
    order: 'order-1 md:order-1',
  },
  {
    id: 'monthly',
    name: 'Mensal',
    price: '35 €',
    period: '/ mês',
    note: 'Por escritório · IVA à parte se aplicável',
    features: ['Flexível — cancela quando quiser', 'Mesmo produto do teste', 'Ideal para experimentar a sério'],
    cta: 'Começar com teste grátis',
    primary: false,
    featured: false,
    order: 'order-3 md:order-2',
  },
  {
    id: 'yearly',
    name: 'Anual',
    price: '29,99 €',
    period: '/ mês',
    note: (
      <>
        Cobrado <strong className="text-[#0F2942]">359,88 € / ano</strong> · por escritório
      </>
    ),
    features: ['~2 meses grátis vs mensal', 'Melhor preço se já vai ficar', 'Mesmo produto, menos custo'],
    cta: 'Quero o melhor valor',
    primary: true,
    featured: true,
    order: 'order-2 md:order-3',
  },
] as const

export function LandingPricing() {
  return (
    <section id="precos" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center px-1">
          <h2 className="text-[1.75rem] font-semibold leading-tight sm:text-3xl md:text-4xl">
            Comece grátis. Pague só se ficar.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4A5568] sm:mt-4 sm:text-base">
            14 dias com o escritório completo — sem cartão. Depois mensal ou anual, sem fidelização.
          </p>
        </FadeInView>

        <FadeInStagger className="mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <FadeInStaggerItem key={plan.id} className={cn('h-full', plan.order)}>
              <article
                className={cn(
                  'landing-card relative flex h-full flex-col p-5 sm:p-6',
                  plan.featured &&
                    'ring-2 ring-[#0F2942]/20 bg-gradient-to-b from-white to-[#E3F0FF]/40 md:col-span-1 lg:scale-[1.02]',
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#0F2942] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white sm:-top-3">
                    Melhor valor
                  </span>
                ) : null}
                <p
                  className={cn(
                    'text-sm font-medium',
                    plan.featured ? 'text-[#0F2942]' : 'text-[#4A5568]',
                  )}
                >
                  {plan.name}
                </p>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-[#0F2942] sm:text-4xl">
                    {plan.price}
                  </span>
                  <span className="text-base font-medium text-[#4A5568] sm:text-lg">{plan.period}</span>
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-[#4A5568] sm:text-sm">{plan.note}</p>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[14px] leading-snug text-[#4A5568] sm:text-[15px]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C9932E]" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={authFirmRegisterUrl()}
                  className={cn(
                    'landing-btn-primary mt-6 w-full text-center',
                    !plan.primary &&
                      '!bg-white !text-[#0F2942] ring-1 ring-[#0F2942]/20 hover:!bg-[#F7FAFC]',
                  )}
                >
                  {plan.cta}
                </Link>
              </article>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>

        <p className="mt-6 px-2 text-center text-[13px] leading-relaxed text-[#4A5568] sm:text-sm">
          O teste de 14 dias é igual em qualquer plano. Sem letras pequenas. Funciona como app (PWA) no
          telemóvel.
        </p>
      </div>
    </section>
  )
}
