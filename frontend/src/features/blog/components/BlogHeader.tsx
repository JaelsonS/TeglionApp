import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

import { authFirmRegisterUrl, authProfileChoiceUrl } from '@/shared/constants/authPaths'
import { LANDING_ANCHORS } from '@/shared/constants/landingAnchors'
import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

const NAV: Array<{ to: string; label: string; external?: boolean }> = [
  { to: '/blog', label: 'Artigos' },
  { to: LANDING_ANCHORS.produto, label: 'Produto', external: true },
  { to: '/pricing', label: 'Preços', external: true },
]

export function BlogHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors',
        scrolled ? 'border blog-border-subtle blog-bg-surface-95 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <div className="blog-container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label={`${BRAND.name} — início`}>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white"
            style={{ backgroundColor: BRAND.colors.navy }}
          >
            {BRAND.initials}
          </span>
          <span className="text-lg font-semibold tracking-tight blog-text-navy">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Blog">
          {NAV.map((item) =>
            item.external ? (
              <a key={item.to} href={item.to} className="rounded-lg px-3 py-2 text-sm blog-text-body blog-hover-surface">
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  pathname.startsWith(item.to) ? 'blog-text-navy' : 'blog-text-body blog-hover-surface',
                )}
                aria-current={pathname.startsWith(item.to) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to={authProfileChoiceUrl('login')} className="rounded-lg px-3 py-2 text-sm blog-text-body">
            Entrar
          </Link>
          <Link to={authFirmRegisterUrl()} className="landing-btn-primary text-sm">
            Teste grátis
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg blog-text-navy md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <nav className="border-t blog-border-subtle px-5 py-4 md:hidden" aria-label="Blog móvel">
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.to}
                href={item.to}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium blog-text-navy"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium blog-text-navy"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      ) : null}
    </header>
  )
}
