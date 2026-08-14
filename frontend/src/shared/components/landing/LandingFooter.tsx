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

const PRODUCT_ANCHORS: { href: string; label: string }[] = [
  { href: LANDING_ANCHORS.funcionalidades, label: 'Funcionalidades' },
  { href: LANDING_ANCHORS.produto, label: 'Ver o produto' },
  { href: LANDING_ANCHORS.faq, label: 'FAQ' },
]

const PRODUCT_ROUTES: { to: string; label: string }[] = [
  { to: '/suporte', label: 'Ajuda e suporte' },
  { to: '/case-studies', label: 'Casos' },
  { to: '/blog', label: 'Blog' },
]

const LEGAL_LINKS: { to: string; label: string }[] = [
  { to: '/termos', label: 'Termos' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/dpa', label: 'DPA' },
  { to: '/aviso-legal', label: 'Aviso legal' },
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
 * Footer institucional da landing — completo e em colunas.
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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
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
            <p className="mt-3 text-sm leading-relaxed text-[#4A5568]">{teglionProductOfAgencyLine()}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/suporte" className="text-[#4A5568] hover:text-[#0F2942]">
                  Sobre / Ajuda
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-[#4A5568] hover:text-[#0F2942]">
                  Preços
                </Link>
              </li>
              <li>
                <Link to={authProfileChoiceUrl('login')} className="text-[#4A5568] hover:text-[#0F2942]">
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">Produto</p>
            <ul className="mt-3 space-y-2 text-sm">
              {PRODUCT_ANCHORS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-[#4A5568] hover:text-[#0F2942]">
                    {item.label}
                  </a>
                </li>
              ))}
              {PRODUCT_ROUTES.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-[#4A5568] hover:text-[#0F2942]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              {LEGAL_LINKS.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-[#4A5568] hover:text-[#0F2942]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">
              AfDigital
            </p>
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

            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[#0F2942]">
              Contacto
            </p>
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
              <li>
                <Link to="/suporte" className="hover:text-[#0F2942]">
                  Atendimento ao cliente
                </Link>
              </li>
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
