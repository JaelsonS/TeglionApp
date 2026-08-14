import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Mail, Phone } from 'lucide-react'

import { AgencyNameLink, AgencyProductLine } from '@/shared/components/agency/AgencyNameLink'
import { ExternalLink } from '@/shared/components/agency/ExternalLink'
import {
  IconFacebook,
  IconInstagram,
  IconLinkedIn,
  IconWhatsApp,
} from '@/shared/components/brand/BrandChannelIcons'
import { authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { LANDING_ANCHORS } from '@/shared/constants/landingAnchors'
import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'
import {
  agencySocialUrl,
  agencyWebsiteUrl,
  mailtoSupportUrl,
  supportEmailDisplay,
  supportPhoneDisplay,
  telSupportUrl,
  whatsappSupportUrl,
} from '@/shared/config/supportLinks'

const LEGAL_FOOTER_LINKS: { to: string; label: string }[] = [
  { to: '/suporte', label: 'Ajuda e suporte' },
  { to: '/termos', label: 'Termos' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/dpa', label: 'DPA' },
  { to: '/aviso-legal', label: 'Aviso Legal' },
]

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">{title}</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[#4A5568]">{children}</ul>
    </div>
  )
}

/**
 * Footer institucional da landing — identidade clara, legais no rodapé, contactos AfDigital.
 * Diferente do footer autenticado (mínimo).
 */
export function LandingFooter() {
  const wa = whatsappSupportUrl()
  const mail = mailtoSupportUrl()
  const tel = telSupportUrl()
  const site = agencyWebsiteUrl()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#0F2942]/10 bg-[#FAFAF7] py-10 sm:py-12">
      <div className="landing-container px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold text-white"
              style={{ backgroundColor: BRAND.colors.navy }}
            >
              {BRAND.initials}
            </span>
            <span className="font-semibold" style={{ color: BRAND.colors.navy }}>
              {BRAND.name}
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-[#0F2942]">
            <AgencyProductLine linkClassName="text-[#0F2942] hover:text-[#C9932E]" />
          </p>

          <p className="mt-4 text-sm leading-relaxed text-[#4A5568]">
            O {BRAND.name} é uma plataforma de software desenvolvida e operada pela{' '}
            <AgencyNameLink className="text-[#0F2942]">{AGENCY.name}</AgencyNameLink>. A utilização
            da plataforma pelos escritórios e os dados inseridos pelos seus utilizadores estão
            sujeitos às responsabilidades definidas nos documentos legais no rodapé.
          </p>
        </div>

        <div className="mt-10 grid gap-8 border-t border-[#0F2942]/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <FooterCol title="Produto">
            <li>
              <a href={LANDING_ANCHORS.funcionalidades} className="hover:text-[#0F2942]">
                Funcionalidades
              </a>
            </li>
            <li>
              <a href={LANDING_ANCHORS.transparencia} className="hover:text-[#0F2942]">
                Transparência
              </a>
            </li>
            <li>
              <Link to="/pricing" className="hover:text-[#0F2942]">
                Preços
              </Link>
            </li>
            <li>
              <Link to={authProfileChoiceUrl('login')} className="hover:text-[#0F2942]">
                Entrar
              </Link>
            </li>
            <li>
              <Link to={authFirmRegisterUrl()} className="font-medium text-[#0F2942] hover:underline">
                Testar 14 dias grátis
              </Link>
            </li>
          </FooterCol>

          <FooterCol title="Legal">
            {LEGAL_FOOTER_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-[#0F2942]">
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterCol>

          <FooterCol title="AfDigital">
            {site ? (
              <li>
                <ExternalLink
                  href={site}
                  aria-label="Website da AfDigital"
                  className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                >
                  <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  Site
                </ExternalLink>
              </li>
            ) : null}
            <li>
              <ExternalLink
                href={agencySocialUrl('instagram')}
                aria-label="Instagram da AfDigital"
                className="inline-flex items-center gap-2 hover:text-[#0F2942]"
              >
                <IconInstagram className="h-4 w-4 shrink-0" />
                Instagram
              </ExternalLink>
            </li>
            <li>
              <ExternalLink
                href={agencySocialUrl('facebook')}
                aria-label="Facebook da AfDigital"
                className="inline-flex items-center gap-2 hover:text-[#0F2942]"
              >
                <IconFacebook className="h-4 w-4 shrink-0" />
                Facebook
              </ExternalLink>
            </li>
            <li>
              <ExternalLink
                href={agencySocialUrl('linkedin')}
                aria-label="LinkedIn da AfDigital"
                className="inline-flex items-center gap-2 hover:text-[#0F2942]"
              >
                <IconLinkedIn className="h-4 w-4 shrink-0" />
                LinkedIn
              </ExternalLink>
            </li>
          </FooterCol>

          <FooterCol title="Contacto">
            {wa ? (
              <li>
                <ExternalLink
                  href={wa}
                  aria-label="Falar com o suporte pelo WhatsApp"
                  className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                >
                  <IconWhatsApp className="h-4 w-4 shrink-0" />
                  WhatsApp
                </ExternalLink>
              </li>
            ) : null}
            {mail ? (
              <li>
                <a
                  href={mail}
                  aria-label="Enviar email para o suporte"
                  className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {supportEmailDisplay()}
                </a>
              </li>
            ) : null}
            {tel ? (
              <li>
                <a
                  href={tel}
                  aria-label="Ligar para o suporte"
                  className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  {supportPhoneDisplay()}
                </a>
              </li>
            ) : null}
          </FooterCol>
        </div>

        <p className="mt-10 border-t border-[#0F2942]/10 pt-6 text-center text-xs leading-relaxed text-[#4A5568]">
          © {year} <AgencyNameLink className="text-[#4A5568] hover:text-[#0F2942]" /> · {BRAND.name}{' '}
          · Feito em Portugal
        </p>
      </div>
    </footer>
  )
}
