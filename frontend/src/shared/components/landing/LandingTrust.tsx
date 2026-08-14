import { Link } from 'react-router-dom'

import { FadeInView } from '@/shared/components/landing/FadeInView'
import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'
import { agencyWebsiteUrl, teglionProductOfAgencyLine } from '@/shared/config/supportLinks'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'

/**
 * Transparência comercial — identidade produto/empresa sem matriz jurídica pesada.
 */
export function LandingTrust() {
  const site = agencyWebsiteUrl()

  return (
    <section
      id="transparencia"
      className="landing-section border-y border-[#0F2942]/8 bg-[#FAFAF7]"
      aria-labelledby="landing-trust-heading"
    >
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C9932E]">
            Transparência e confiança
          </p>
          <h2
            id="landing-trust-heading"
            className="mt-3 text-2xl font-semibold tracking-tight text-[#0F2942] sm:text-3xl"
          >
            Uma plataforma da {AGENCY.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-[#0F2942]/80">{teglionProductOfAgencyLine()}</p>
          <p className="mt-5 text-[15px] leading-relaxed text-[#4A5568] sm:text-base">
            O {BRAND.name} é uma plataforma de gestão para escritórios de contabilidade, desenvolvida e
            operada pela {AGENCY.displayName}. {BRAND.name} é o nome do produto — não uma empresa
            independente.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4A5568] sm:text-base">
            Cada escritório mantém a responsabilidade pelas informações, documentos e dados que
            introduz na plataforma e pela utilização que faz do serviço. A {AGENCY.name} é
            responsável pela plataforma e pelos serviços que efetivamente presta, nos termos
            aplicáveis.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#4A5568]">
            O detalhe das responsabilidades de cada parte está nos{' '}
            <Link to="/termos" className="font-medium text-[#0F2942] underline-offset-2 hover:underline">
              Termos de Utilização
            </Link>{' '}
            e na{' '}
            <Link
              to="/privacidade"
              className="font-medium text-[#0F2942] underline-offset-2 hover:underline"
            >
              Política de Privacidade
            </Link>
            .
          </p>
          {site ? (
            <button
              type="button"
              className="mt-6 text-sm font-semibold text-[#0F2942] underline-offset-4 hover:underline"
              onClick={() => openExternalUrl(site)}
            >
              Conhecer a AfDigital
            </button>
          ) : null}
        </FadeInView>
      </div>
    </section>
  )
}
