import { Link } from 'react-router-dom'

import { AgencyNameLink, AgencyProductLine } from '@/shared/components/agency/AgencyNameLink'
import { ExternalLink } from '@/shared/components/agency/ExternalLink'
import { FadeInView } from '@/shared/components/landing/FadeInView'
import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'
import { agencyWebsiteUrl } from '@/shared/config/supportLinks'

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
          <img
            src="/branding/afdigital-office.png"
            alt="Sala de reuniões da AfDigital — Soluções Tecnológicas"
            className="mx-auto mb-8 w-full max-w-2xl rounded-2xl object-cover shadow-[0_12px_40px_rgba(15,41,66,0.12)]"
            width={1280}
            height={720}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C9932E]">
            Transparência e confiança
          </p>
          <h2
            id="landing-trust-heading"
            className="mt-3 text-2xl font-semibold tracking-tight text-[#0F2942] sm:text-3xl"
          >
            Uma plataforma da {AGENCY.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-[#0F2942]/80">
            <AgencyProductLine linkClassName="text-[#0F2942] hover:text-[#C9932E]" />
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-[#4A5568] sm:text-base">
            O {BRAND.name} é uma plataforma de gestão para escritórios de contabilidade, desenvolvida e
            operada pela <AgencyNameLink className="text-[#0F2942]" />. {BRAND.name} é o nome do
            produto — não uma empresa independente.
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
            <ExternalLink
              href={site}
              className="mt-6 inline-block text-sm font-semibold text-[#0F2942] underline-offset-4 hover:underline"
            >
              Conhecer a AfDigital
            </ExternalLink>
          ) : null}
        </FadeInView>
      </div>
    </section>
  )
}
