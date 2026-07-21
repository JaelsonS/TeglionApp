import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

import { ADSENSE_LIVE } from '@/features/blog/blogMonetization'
import { BlogAdSense } from '@/shared/components/ads/BlogAdSense'
import { BlogHeader } from '@/features/blog/components/BlogHeader'
import { LandingFooter } from '@/shared/components/landing/LandingFooter'
import { loadThirdPartyScripts, trackPageView } from '@/shared/utils/thirdPartyScripts'
import '@/shared/components/landing/landing.css'
import '@/features/blog/blog.css'

function hasAcceptedCookieConsent() {
  if (typeof window === 'undefined') return false
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (!key?.startsWith('cookieConsent:')) continue
    if (window.localStorage.getItem(key) === 'accepted') return true
  }
  return false
}

function useBlogAnalytics() {
  const location = useLocation()

  useEffect(() => {
    if (!hasAcceptedCookieConsent()) return
    void loadThirdPartyScripts().then(() => {
      trackPageView(`${location.pathname}${location.search}`, document.title)
    })
  }, [location.pathname, location.search])
}

function useBlogResourceHints() {
  useEffect(() => {
    const links = [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'preconnect', href: 'https://www.googletagmanager.com' },
    ] as const

    const nodes: HTMLLinkElement[] = []

    for (const item of links) {
      const link = document.createElement('link')
      link.rel = item.rel
      link.href = item.href
      if ('crossOrigin' in item && item.crossOrigin) link.crossOrigin = item.crossOrigin
      document.head.appendChild(link)
      nodes.push(link)
    }

    const font = document.createElement('link')
    font.rel = 'stylesheet'
    font.href =
      'https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,600;7..72,700&display=swap'
    document.head.appendChild(font)
    nodes.push(font)

    return () => {
      nodes.forEach((node) => node.remove())
    }
  }, [])
}

export function BlogLayout() {
  useBlogResourceHints()
  useBlogAnalytics()
  return (
    <div className="blog-page">
      {ADSENSE_LIVE ? <BlogAdSense /> : null}
      <a href="#blog-main" className="blog-skip-link">
        Saltar para o conteúdo
      </a>
      <BlogHeader />
      <main id="blog-main">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  )
}
