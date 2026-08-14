import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Globe, Mail, Phone } from 'lucide-react'

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
  teglionProductOfAgencyLine,
  telSupportUrl,
  whatsappSupportUrl,
} from '@/shared/config/supportLinks'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'

const LEGAL_FOOTER_LINKS: { to: string; label: string }[] = [
  { to: '/suporte', label: 'Ajuda e suporte' },
  { to: '/termos', label: 'Termos' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/dpa', label: 'DPA' },
  { to: '/aviso-legal', label: 'Aviso Legal' },
]

function ExtLink({
  href,
  children,
  ariaLabel,
  className = 'text-[#4A5568] hover:text-[#0F2942]',
}: {
  href: string
  children: ReactNode
  ariaLabel: string
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        openExternalUrl(href)
      }}
    >
      {children}
    </a>
  )
}

/**
 * Footer institucional da landing — identidade clara, links compactos, contactos AfDigital.
 * Diferente do footer autenticado (mínimo).
 */
export function LandingFooter() {
  const wa = whatsappSupportUrl()
  const mail = mailtoSupportUrl()
  const tel = telSupportUrl()
  const site = agencyWebsiteUrl()
  const year = new Date().getFullYear()
  const compactLinks: { to?: string; href?: string; external?: boolean; label: string }[] = [
    ...(site ? [{ href: site, external: true as const, label: 'Sobre a AfDigital' }] : []),
    ...LEGAL_FOOTER_LINKS,
  ]

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

          <p className="mt-3 text-sm font-medium text-[#0F2942]">{teglionProductOfAgencyLine()}</p>

          <p className="mt-4 text-sm leading-relaxed text-[#4A5568]">
            O {BRAND.name} é uma plataforma de software desenvolvida e operada pela {AGENCY.name}. A
            utilização da plataforma pelos escritórios e os dados inseridos pelos seus utilizadores
            estão sujeitos às responsabilidades definidas nos{' '}
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

          <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px] text-[#4A5568] sm:text-[13px]"
            aria-label="Links institucionais"
          >
            {compactLinks.map((item, index) => {
              const sep = index > 0 ? <span className="text-[#0F2942]/25" aria-hidden>·</span> : null
              if (item.external && item.href) {
                return (
                  <span key={item.label} className="inline-flex items-center gap-2">
                    {sep}
                    <ExtLink
                      href={item.href}
                      ariaLabel={item.label}
                      className="hover:text-[#0F2942] hover:underline underline-offset-2"
                    >
                      {item.label}
                    </ExtLink>
                  </span>
                )
              }
              return (
                <span key={item.label} className="inline-flex items-center gap-2">
                  {sep}
                  <Link
                    to={item.to || '/'}
                    className="hover:text-[#0F2942] hover:underline underline-offset-2"
                  >
                    {item.label}
                  </Link>
                </span>
              )
            })}
          </nav>
        </div>

        <div className="mt-10 grid gap-8 border-t border-[#0F2942]/10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">Produto</p>
            <ul className="mt-3 space-y-2 text-sm text-[#4A5568]">
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
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">AfDigital</p>
            <ul className="mt-3 space-y-2.5 text-sm text-[#4A5568]">
              {site ? (
                <li>
                  <ExtLink
                    href={site}
                    ariaLabel="Website da AfDigital"
                    className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                  >
                    <Globe className="h-4 w-4 shrink-0" aria-hidden />
                    Site
                  </ExtLink>
                </li>
              ) : null}
              <li>
                <ExtLink
                  href={agencySocialUrl('instagram')}
                  ariaLabel="Instagram da AfDigital"
                  className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                >
                  <IconInstagram className="h-4 w-4 shrink-0" />
                  Instagram
                </ExtLink>
              </li>
              <li>
                <ExtLink
                  href={agencySocialUrl('facebook')}
                  ariaLabel="Facebook da AfDigital"
                  className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                >
                  <IconFacebook className="h-4 w-4 shrink-0" />
                  Facebook
                </ExtLink>
              </li>
              <li>
                <ExtLink
                  href={agencySocialUrl('linkedin')}
                  ariaLabel="LinkedIn da AfDigital"
                  className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                >
                  <IconLinkedIn className="h-4 w-4 shrink-0" />
                  LinkedIn
                </ExtLink>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">Contacto</p>
            <ul className="mt-3 space-y-2.5 text-sm text-[#4A5568]">
              {wa ? (
                <li>
                  <ExtLink
                    href={wa}
                    ariaLabel="Falar com o suporte pelo WhatsApp"
                    className="inline-flex items-center gap-2 hover:text-[#0F2942]"
                  >
                    <IconWhatsApp className="h-4 w-4 shrink-0" />
                    WhatsApp
                  </ExtLink>
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
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-[#0F2942]/10 pt-6 text-center text-xs leading-relaxed text-[#4A5568]">
          © {year} {AGENCY.displayName} · {BRAND.name} · Feito em Portugal
        </p>
      </div>
    </footer>
  )
}
