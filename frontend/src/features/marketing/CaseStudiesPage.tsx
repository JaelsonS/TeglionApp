import { Link } from 'react-router-dom'

import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { FadeInView } from '@/shared/components/landing/FadeInView'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { BRAND } from '@/shared/config/brand'

export function CaseStudiesPage() {
  return (
    <LandingMarketingShell
      title={`Casos de sucesso | ${BRAND.name}`}
      description={`Histórias reais de escritórios no ${BRAND.name}. Publicamos só com autorização — sem depoimentos inventados.`}
      path="/case-studies"
    >
      <section className="landing-section">
        <div className="landing-container">
          <FadeInView className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">Casos de sucesso</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#0F2942] sm:text-5xl">
              As histórias vêm a seguir
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#4A5568]">
              Ainda não temos casos públicos — e preferimos assim a inventar resultados. Quando um escritório
              autorizar a partilhar a sua experiência no {BRAND.name}, a história aparece aqui, com contexto real.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#4A5568]">
              Se gere um escritório e quer experimentar cedo, o trial de 14 dias é o caminho mais simples. Se
              preferir conversar antes, escreva-nos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary px-8 py-3">
                Experimentar 14 dias grátis
              </Link>
              <a
                href={`mailto:${BRAND.emails.hello}?subject=Caso%20de%20sucesso%20/%20piloto%20${BRAND.name}`}
                className="landing-btn-ghost px-6 py-3 text-sm font-medium"
              >
                Falar connosco
              </a>
            </div>
            <p className="mt-8 text-sm text-[#4A5568]">
              <Link to="/" className="hover:text-[#0F2942] hover:underline">
                ← Voltar ao início
              </Link>
            </p>
          </FadeInView>
        </div>
      </section>
    </LandingMarketingShell>
  )
}
