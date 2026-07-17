import { Link } from 'react-router-dom'

import { authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { LANDING_ANCHORS } from '@/shared/constants/landingAnchors'
import { BRAND } from '@/shared/config/brand'

const LEGAL_LINKS = [
  { to: '/termos', label: 'Termos de utilização' },
  { to: '/privacidade', label: 'Privacidade' },
  { to: '/dpa', label: 'DPA' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/aviso-legal', label: 'Aviso legal' },
] as const

export function LandingFooter() {
  return (
    <footer className="border-t border-[#0F2942]/10 bg-[#FAFAF7] py-12">
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
            <p className="mt-3 text-sm text-[#4A5568]">{BRAND.tagline}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">Produto</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/blog" className="text-[#4A5568] hover:text-[#0F2942]">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/case-studies" className="text-[#4A5568] hover:text-[#0F2942]">
                  Casos de sucesso
                </Link>
              </li>
              <li>
                <a href={LANDING_ANCHORS.produto} className="text-[#4A5568] hover:text-[#0F2942]">
                  Ver demonstração
                </a>
              </li>
              <li>
                <a href={LANDING_ANCHORS.comoFunciona} className="text-[#4A5568] hover:text-[#0F2942]">
                  Como funciona
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">Conta</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/pricing" className="text-[#4A5568] hover:text-[#0F2942]">
                  Preços
                </Link>
              </li>
              <li>
                <a href={LANDING_ANCHORS.faq} className="text-[#4A5568] hover:text-[#0F2942]">
                  FAQ
                </a>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0F2942]">Contacto</p>
            <p className="mt-3 text-sm text-[#4A5568]">
              <a href={`mailto:${BRAND.emails.hello}`} className="hover:text-[#0F2942]">
                {BRAND.emails.hello}
              </a>
            </p>
          </div>
        </div>

        <p className="mt-10 border-t border-[#0F2942]/10 pt-6 text-center text-xs text-[#4A5568]">
          © {BRAND.name} {new Date().getFullYear()} · Feito em Portugal
        </p>

        <nav
          className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] leading-relaxed text-[#4A5568]/80"
          aria-label="Documentos legais"
        >
          {LEGAL_LINKS.map((item, index) => (
            <span key={item.to} className="inline-flex items-center gap-3">
              {index > 0 ? (
                <span className="text-[#0F2942]/15" aria-hidden>
                  ·
                </span>
              ) : null}
              <Link to={item.to} className="hover:text-[#0F2942] hover:underline">
                {item.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
    </footer>
  )
}
