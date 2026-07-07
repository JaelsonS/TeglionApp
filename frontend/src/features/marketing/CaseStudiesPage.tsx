import { Link } from 'react-router-dom'

import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { FadeInView } from '@/shared/components/landing/FadeInView'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { BRAND } from '@/shared/config/brand'

export function CaseStudiesPage() {
  return (
    <LandingMarketingShell
      title={`Casos de estudo | ${BRAND.name}`}
      description="Histórias de escritórios no TegLion — publicaremos casos reais assim que estiverem disponíveis."
      path="/case-studies"
    >
      <section className="landing-section">
        <div className="landing-container">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <h1 className="mt-2 text-4xl font-semibold text-[#0F2942]">Casos de estudo em preparação</h1>
            <p className="mt-4 text-lg text-[#4A5568]">
              O {BRAND.name} está em fase inicial. Não publicamos depoimentos nem resultados inventados — quando
              tivermos histórias reais de escritórios, com autorização, aparecem aqui.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary px-8 py-3">
                Experimentar 14 dias grátis
              </Link>
              <Link to="/" className="landing-btn-ghost px-6 py-3 text-sm font-medium">
                Voltar ao início
              </Link>
            </div>
            <p className="mt-6 text-sm text-[#4A5568]">
              É contabilista e quer ser dos primeiros?{' '}
              <a href={`mailto:${BRAND.emails.hello}`} className="font-medium text-[#0F2942] hover:underline">
                {BRAND.emails.hello}
              </a>
            </p>
          </FadeInView>
        </div>
      </section>
    </LandingMarketingShell>
  )
}
