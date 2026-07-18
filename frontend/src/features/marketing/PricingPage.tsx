import { Link } from 'react-router-dom'

import { LandingFaq } from '@/shared/components/landing/LandingFaq'
import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { LandingPricing } from '@/shared/components/landing/LandingPricing'
import { LandingSocialProof } from '@/shared/components/landing/LandingSocialProof'
import { FadeInView } from '@/shared/components/landing/FadeInView'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { BRAND } from '@/shared/config/brand'
import { usePublicPricing } from '@/shared/config/pricingPlans'

const INCLUDED = [
  'Painel operacional e carteira de clientes',
  'Obrigações fiscais e tarefas',
  'Pedidos e validação de documentos',
  'Mensagens escritório ↔ cliente',
  'Portal do cliente (web + mobile)',
  'Alertas e comunicados',
  'Central de serviços e orçamentos',
  'Utilizadores ilimitados no trial',
  
] as const

export function PricingPage() {
  const { trialDays, monthlyLabel, yearlyMonthlyLabel, yearlyTotalLabel } = usePublicPricing()
  return (
    <LandingMarketingShell
      title={`Preços | ${BRAND.name}`}
      description={`${trialDays} dias grátis. Depois ${monthlyLabel}/mês ou ${yearlyTotalLabel}/ano (equiv. ${yearlyMonthlyLabel}/mês). Por escritório, sem fidelização.`}
      path="/pricing"
    >
      <section className="landing-section pb-0">
        <div className="landing-container">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">Preços</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#0F2942] sm:text-4xl md:text-5xl">Sem surpresas</h1>
            <p className="mt-3 text-base text-[#4A5568] sm:mt-4 sm:text-lg">
              14 dias para usar o escritório a sério, sem cartão. Se ficar, escolhe mensal ou anual.
            </p>
          </FadeInView>
        </div>
      </section>

      <LandingPricing />

      <section className="landing-section pt-0">
        <div className="landing-container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#0F2942]/10 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#0F2942]">O que está incluído</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#4A5568]">
                  <span className="text-[#C9932E]" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-[#4A5568]">
              Precisas de condições para o piloto?{' '}
              <a href={`mailto:${BRAND.emails.hello}`} className="font-medium text-[#0F2942] hover:underline">
                Escreve-nos
              </a>
              .
            </p>
            <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-6 inline-block px-8 py-3">
              Começar os 14 dias
            </Link>
          </div>
        </div>
      </section>

      <LandingSocialProof className="landing-section border-t border-[#0F2942]/10 bg-[#FAFAF7]" />

      <LandingFaq />
    </LandingMarketingShell>
  )
}
