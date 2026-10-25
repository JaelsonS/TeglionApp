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
  'Mensagens gabinete ↔ cliente',
  'Portal do cliente',
  'Página pública do gabinete',
  'Catálogo e personalização de serviços',
  'Fluxos IRS e pedidos estruturados',
  'Pagamentos do cliente na plataforma',
  'Google Calendar e Drive',
  'Alertas e comunicados',
  'Utilizadores ilimitados no trial',
] as const

export function PricingPage() {
  const { trialDays, monthlyLabel, yearlyMonthlyLabel, yearlyTotalLabel } = usePublicPricing()
  return (
    <LandingMarketingShell
      title={`Preços Teglion | Software para gabinetes de contabilidade`}
      description={`Planos Teglion para gabinetes em Portugal: ${trialDays} dias grátis, depois ${monthlyLabel}/mês ou ${yearlyTotalLabel}/ano. Painel, portal e página pública incluídos. Sem fidelização.`}
      path="/pricing"
    >
      <section className="landing-section pb-0">
        <div className="landing-container">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-caption font-semibold uppercase tracking-wide text-warning">Preços</p>
            <h1 className="mt-2 font-sans text-3xl font-semibold text-brand sm:text-4xl md:text-5xl">
              Preços claros para o gabinete
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              14 dias para usar o gabinete a sério, sem cartão. Se ficar, escolhe mensal ou anual.
            </p>
          </FadeInView>
        </div>
      </section>

      <LandingPricing />

      <section className="landing-section pt-0">
        <div className="landing-container">
          <div className="mx-auto max-w-2xl rounded-2xl border border-[#0B3A6E]/10 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#0B3A6E]">O que está incluído</h2>
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
              Dúvidas sobre faturação?{' '}
              <a href={`mailto:${BRAND.emails.hello}`} className="font-medium text-[#0B3A6E] hover:underline">
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

      <LandingSocialProof className="landing-section border-t border-[#0B3A6E]/10 bg-[#FAFAF7]" />

      <LandingFaq />
    </LandingMarketingShell>
  )
}
