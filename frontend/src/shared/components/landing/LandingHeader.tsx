import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { LANDING_ANCHORS } from '@/shared/constants/landingAnchors'
import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

const NAV = [
  { href: '/blog', label: 'Blog', route: true },
  { href: LANDING_ANCHORS.produto, label: 'Produto' },
  { href: '/pricing', label: 'Preços', route: true },
  { href: '/security', label: 'Segurança', route: true },
  { href: LANDING_ANCHORS.faq, label: 'FAQ' },
] as const

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,border] duration-300',
        scrolled ? 'landing-header-scrolled' : 'bg-transparent',
      )}
    >
      <div className="landing-container flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src={BRAND.assets.icon} alt="" className="h-9 w-9 rounded-xl sm:hidden" aria-hidden />
          <img src={BRAND.assets.wordmark} alt={BRAND.name} className="hidden h-8 sm:block" />
          <span className="text-lg font-semibold tracking-tight sm:hidden" style={{ color: BRAND.colors.navy }}>
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV.map((item) =>
            'route' in item && item.route ? (
              <Link key={item.href} to={item.href} className="landing-btn-ghost px-3 py-2 text-sm">
                {item.label}
              </Link>
            ) : (
              <a key={item.href} href={item.href} className="landing-btn-ghost px-3 py-2 text-sm">
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to={authProfileChoiceUrl('login')} className="landing-btn-ghost text-sm">
            Entrar
          </Link>
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary text-sm">
            Começar grátis
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-[#0F2942] transition hover:bg-[#0F2942]/6 md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[#0F2942]/10 bg-[#FAFAF7] md:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 py-4">
              {NAV.map((item) =>
                'route' in item && item.route ? (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#0F2942]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#0F2942]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ),
              )}
              <Link
                to={authProfileChoiceUrl('login')}
                className="rounded-lg px-3 py-2.5 text-sm text-[#4A5568]"
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to={authFirmRegisterUrl()}
                className="landing-btn-primary mt-2 text-center"
                onClick={() => setMenuOpen(false)}
              >
                Começar grátis
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
