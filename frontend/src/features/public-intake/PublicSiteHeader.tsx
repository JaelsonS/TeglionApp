'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Menu } from 'lucide-react'

import type { PublicSiteChromeContent, PublicSiteNavLink } from '@/shared/types/firmPublicSite'
import {
  contentAlignFlexClass,
  resolveSectionContentAlign,
} from '@/features/public-intake/publicSiteContentAlign'
import { defaultPublicSiteNavLinks } from '@/features/public-intake/publicSiteNavLinks'
import { uniquePublicServiceGroups } from '@/features/public-intake/clusterPublicServices'
import type { PublicSiteRenderContext } from '@/features/public-intake/templates/default/DefaultSections'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'

function hexStyle(color?: string | null): string | undefined {
  const v = String(color || '').trim()
  return /^#[0-9a-f]{6}$/i.test(v) ? v : undefined
}

function HeaderNavItem({
  link,
  ctx,
  groups,
  navClass,
  labelStyle,
  onNavigate,
}: {
  link: PublicSiteNavLink
  ctx: PublicSiteRenderContext
  groups: ReturnType<typeof uniquePublicServiceGroups>
  navClass: string
  labelStyle?: { color: string }
  onNavigate?: () => void
}) {
  if (link.kind === 'areas') {
    return (
      <details className="group relative shrink-0">
        <summary
          className={`flex cursor-pointer list-none items-center gap-1 rounded-lg px-2.5 py-1.5 marker:content-none ${navClass}`}
          style={labelStyle}
        >
          {link.label}
          <ChevronDown className="h-3.5 w-3.5 opacity-70 transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="absolute right-0 z-30 mt-1 max-h-[70vh] w-72 overflow-y-auto rounded-xl border border-border/70 bg-card p-2 shadow-lg">
          {groups.map((group) => (
            <div key={group.heading || 'outros'} className="border-b border-border/40 py-2 last:border-0">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.heading}
              </p>
              <ul>
                {group.items.slice(0, 16).map((service) => (
                  <li key={service.slug}>
                    <Link
                      to={`/${encodeURIComponent(ctx.firmSlug)}/servicos/${encodeURIComponent(service.slug)}`}
                      className="block rounded-md px-2 py-1.5 text-sm text-foreground/90 hover:bg-muted hover:text-foreground"
                      onClick={onNavigate}
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    )
  }

  if (link.kind === 'external' && link.url) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 rounded-lg px-2.5 py-1.5 ${navClass}`}
        style={labelStyle}
        onClick={onNavigate}
      >
        {link.label}
      </a>
    )
  }

  if (link.kind === 'service' && link.serviceId) {
    const href = `/${encodeURIComponent(ctx.firmSlug)}/servicos/${encodeURIComponent(link.serviceId)}`
    return (
      <Link
        to={href}
        target={ctx.openInternalLinksInNewTab ? '_blank' : undefined}
        rel={ctx.openInternalLinksInNewTab ? 'noopener noreferrer' : undefined}
        className={`shrink-0 rounded-lg px-2.5 py-1.5 ${navClass}`}
        style={labelStyle}
        onClick={onNavigate}
      >
        {link.label}
      </Link>
    )
  }

  const sectionId = link.sectionId || 'servicos'
  return (
    <a
      href={`#${sectionId}`}
      className={`shrink-0 rounded-lg px-2.5 py-1.5 ${navClass}`}
      style={labelStyle}
      onClick={onNavigate}
    >
      {link.label}
    </a>
  )
}

function MobileNavLink({
  link,
  ctx,
  groups,
  navClass,
  labelStyle,
  onNavigate,
}: {
  link: PublicSiteNavLink
  ctx: PublicSiteRenderContext
  groups: ReturnType<typeof uniquePublicServiceGroups>
  navClass: string
  labelStyle?: { color: string }
  onNavigate: () => void
}) {
  if (link.kind === 'areas') {
    return (
      <details className="group rounded-lg border border-border/40 px-2 py-1">
        <summary
          className={`flex cursor-pointer list-none items-center justify-between gap-2 py-2 marker:content-none ${navClass}`}
          style={labelStyle}
        >
          {link.label}
          <ChevronDown className="h-4 w-4 opacity-70 transition group-open:rotate-180" aria-hidden />
        </summary>
        <div className="pb-2 pl-1">
          {groups.map((group) => (
            <div key={group.heading || 'outros'} className="mt-2">
              {group.heading ? (
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.heading}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.slice(0, 16).map((service) => (
                  <li key={service.slug}>
                    <Link
                      to={`/${encodeURIComponent(ctx.firmSlug)}/servicos/${encodeURIComponent(service.slug)}`}
                      className="block rounded-md px-2 py-2 text-sm text-foreground/90 hover:bg-muted"
                      onClick={onNavigate}
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    )
  }

  return (
    <div className="py-0.5">
      <HeaderNavItem
        link={link}
        ctx={ctx}
        groups={groups}
        navClass={`block w-full py-2.5 text-base ${navClass}`}
        labelStyle={labelStyle}
        onNavigate={onNavigate}
      />
    </div>
  )
}

export function HeaderSection({
  ctx,
  content,
}: {
  ctx: PublicSiteRenderContext
  content?: PublicSiteChromeContent
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const bg = hexStyle(content?.backgroundColor)
  const text = hexStyle(content?.textColor)
  const headerLabel = String(content?.title || '').trim() || ctx.firmName
  const labelStyle = text ? { color: text } : undefined
  const labelClass = text
    ? 'font-semibold tracking-wide'
    : 'font-semibold tracking-wide text-[hsl(var(--brand-text,var(--primary)))]'
  const navClass = text
    ? 'text-sm font-medium opacity-90 hover:opacity-100'
    : 'text-sm font-medium text-[hsl(var(--brand-text,var(--muted-foreground)))] hover:text-[hsl(var(--brand-text,var(--foreground)))]'
  const groups = uniquePublicServiceGroups(ctx.services)
  const homeHref = `/${encodeURIComponent(ctx.firmSlug)}`
  const showNav = content?.showNav !== false
  const headerLogo = ctx.headerLogoUrl ?? ctx.logoUrl
  const showLogo = Boolean(headerLogo) && content?.showLogo !== false
  const navLinks = defaultPublicSiteNavLinks(content).filter((link) => link.enabled)
  const publicSlugs = new Set(ctx.services.map((s) => s.slug).filter(Boolean))
  const visibleLinks = navLinks.filter((link) => {
    if (link.kind === 'areas') return groups.length > 0
    if (link.kind === 'external') return Boolean(link.url)
    if (link.kind === 'service') return Boolean(link.serviceId && publicSlugs.has(link.serviceId))
    return Boolean(link.label)
  })

  const closeMenu = () => setMenuOpen(false)
  const align = resolveSectionContentAlign(content)

  return (
    <header
      className={bg ? 'border-b border-black/5' : 'border-b border-primary/20 bg-transparent'}
      style={bg ? { backgroundColor: bg } : undefined}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 lg:max-w-4xl">
        <div className={`flex min-w-0 flex-1 items-center gap-3 ${contentAlignFlexClass(align)}`}>
          {showLogo ? (
            <Link to={homeHref} className="shrink-0" aria-label={headerLabel}>
              <img src={headerLogo!} alt="" className="h-9 w-9 rounded-md object-contain" />
            </Link>
          ) : null}
          <Link to={homeHref} className={`min-w-0 truncate ${labelClass}`} style={labelStyle}>
            {headerLabel}
          </Link>
        </div>
        {showNav && visibleLinks.length > 0 ? (
          <>
            <nav
              className="ml-auto hidden min-w-0 items-center gap-1 overflow-x-auto text-sm lg:flex"
              aria-label="Navegação do site"
            >
              {visibleLinks.map((link) => (
                <HeaderNavItem
                  key={link.id}
                  link={link}
                  ctx={ctx}
                  groups={groups}
                  navClass={navClass}
                  labelStyle={labelStyle}
                />
              ))}
            </nav>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto shrink-0 lg:hidden"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
                <SheetHeader>
                  <SheetTitle className="text-left text-base">{headerLabel}</SheetTitle>
                </SheetHeader>
                <nav className="mt-4 flex flex-col gap-1" aria-label="Navegação do site (mobile)">
                  {visibleLinks.map((link) => (
                    <MobileNavLink
                      key={link.id}
                      link={link}
                      ctx={ctx}
                      groups={groups}
                      navClass={navClass}
                      labelStyle={labelStyle}
                      onNavigate={closeMenu}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </>
        ) : null}
      </div>
    </header>
  )
}
