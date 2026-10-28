import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'

import { AgencyNameLink } from '@/shared/components/agency/AgencyNameLink'
import { ExternalLink } from '@/shared/components/agency/ExternalLink'
import { IconWhatsApp } from '@/shared/components/brand/BrandChannelIcons'
import { LandingBrandMark } from '@/shared/components/landing/LandingBrandMark'
import { authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { LANDING_ANCHORS } from '@/shared/constants/landingAnchors'
import { BRAND } from '@/shared/config/brand'
import {
  mailtoSupportUrl,
  supportEmailDisplay,
  supportPhoneDisplay,
  telSupportUrl,
  whatsappSupportUrl,
} from '@/shared/config/supportLinks'

/** Só documentos legais — Manual fica em Produto (evita duplicar no footer). */
const LEGAL_FOOTER_LINKS: { to: string; label: string }[] = [
  { to: '/termos', label: 'Termos' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/dpa', label: 'DPA' },
  { to: '/aviso-legal', label: 'Aviso Legal' },
]

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="landing-footer-title">{title}</p>
      <ul className="mt-3 space-y-2.5 text-sm">{children}</ul>
    </div>
  )
}

/** Link interno: se já estiver na mesma rota, sobe ao topo (senão o clique «não faz nada»). */
function FooterNavLink({ to, children }: { to: string; children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <Link
      to={to}
      onClick={() => {
        if (pathname === to || (to !== '/' && pathname.startsWith(`${to}/`))) {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }}
    >
      {children}
    </Link>
  )
}

/**
 * Footer comercial Teglion — AfDigital só no copyright (transparência sem pitch).
 */
export function LandingFooter() {
  const wa = whatsappSupportUrl()
  const mail = mailtoSupportUrl()
  const tel = telSupportUrl()
  const year = new Date().getFullYear()

  return (
    <footer className="landing-footer py-12 sm:py-14">
      <div className="landing-container px-5 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <LandingBrandMark onDark />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/55">
              Software para gabinetes de contabilidade em Portugal — gabinete, portal e página
              pública no mesmo sistema.
            </p>
          </div>
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary w-full sm:w-auto">
            Testar 14 dias grátis
          </Link>
        </div>

        <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          <FooterCol title="Produto">
            <li>
              <a href={LANDING_ANCHORS.produto}>O produto</a>
            </li>
            <li>
              <a href={LANDING_ANCHORS.precos}>Preços</a>
            </li>
            <li>
              <a href={LANDING_ANCHORS.comoFunciona}>Como funciona</a>
            </li>
            <li>
              <FooterNavLink to="/manual">Manual do utilizador</FooterNavLink>
            </li>
            <li>
              <FooterNavLink to="/suporte">Ajuda e suporte</FooterNavLink>
            </li>
            <li>
              <Link to={authProfileChoiceUrl('login')}>Entrar</Link>
            </li>
          </FooterCol>

          <FooterCol title="Legal">
            {LEGAL_FOOTER_LINKS.map((item) => (
              <li key={item.to}>
                <FooterNavLink to={item.to}>{item.label}</FooterNavLink>
              </li>
            ))}
          </FooterCol>

          <FooterCol title="Contacto">
            {wa ? (
              <li>
                <ExternalLink
                  href={wa}
                  aria-label="Falar com o suporte pelo WhatsApp"
                  className="inline-flex items-center gap-2"
                >
                  <IconWhatsApp className="h-4 w-4 shrink-0" />
                  WhatsApp
                </ExternalLink>
              </li>
            ) : null}
            {mail ? (
              <li>
                <a href={mail} aria-label="Enviar email para o suporte" className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden />
                  {supportEmailDisplay()}
                </a>
              </li>
            ) : null}
            {tel ? (
              <li>
                <a href={tel} aria-label="Ligar para o suporte" className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  {supportPhoneDisplay()}
                </a>
              </li>
            ) : null}
          </FooterCol>
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-white/45">
          © {year} <AgencyNameLink className="text-white/55 hover:text-white" /> · {BRAND.name} ·
          Feito em Portugal
        </p>
      </div>
    </footer>
  )
}
