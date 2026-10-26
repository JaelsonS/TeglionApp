import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { LANDING_ANCHORS } from '@/shared/constants/landingAnchors'
import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

const NAV = [
  { href: LANDING_ANCHORS.produto, label: 'Produto' },
  { href: LANDING_ANCHORS.precos, label: 'Preços' },
  { href: LANDING_ANCHORS.comoFunciona, label: 'Como funciona' },
  { href: '/blog', label: 'Blog', route: true },
  { href: LANDING_ANCHORS.faq, label: 'FAQ' },
] as const

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
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

  const onDark = !scrolled && !menuOpen

  return (
    <header
      className={cn(
        'landing-header fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,border] duration-300',
        scrolled ? 'landing-header-scrolled' : 'bg-transparent',
      )}
    >
      <div className="landing-container flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src={BRAND.assets.icon}
            alt=""
            className={cn('h-9 w-9 rounded-xl sm:hidden', onDark && 'brightness-0 invert')}
            aria-hidden
          />
          <img
            src={BRAND.assets.wordmark}
            alt={BRAND.name}
            className={cn('landing-nav-brand hidden h-8 sm:block', onDark && 'brightness-0 invert')}
          />
          <span
            className={cn(
              'text-lg font-semibold tracking-tight sm:hidden',
              onDark ? 'text-white' : 'text-[var(--landing-navy)]',
            )}
          >
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map((item) =>
            'route' in item && item.route ? (
              <Link
                key={item.href}
                to={item.href}
                className={cn('landing-btn-ghost px-3 py-2 text-sm', onDark && 'landing-btn-ghost-light')}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className={cn('landing-btn-ghost px-3 py-2 text-sm', onDark && 'landing-btn-ghost-light')}
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to={authProfileChoiceUrl('login')}
            className={cn('landing-btn-ghost text-sm', onDark && 'landing-btn-ghost-light')}
          >
            Entrar
          </Link>
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary text-sm whitespace-nowrap !min-h-10 !py-2 !px-4">
            Testar 14 dias
          </Link>
        </div>

        <button
          type="button"
          className={cn(
            'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition lg:hidden',
            onDark ? 'text-white hover:bg-white/10' : 'text-[var(--landing-navy)] hover:bg-[var(--landing-navy)]/6',
          )}
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
            className="border-t border-white/10 bg-[#061428] lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 py-4">
              {NAV.map((item) =>
                'route' in item && item.route ? (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ),
              )}
              <Link
                to={authProfileChoiceUrl('login')}
                className="rounded-lg px-3 py-2.5 text-sm text-white/70"
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to={authFirmRegisterUrl()}
                className="landing-btn-primary mt-2 text-center"
                onClick={() => setMenuOpen(false)}
              >
                Começar o teste grátis
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
