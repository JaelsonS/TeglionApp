import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'

import { ADSENSE_LIVE } from '@/features/blog/blogMonetization'
import { BlogAdSense } from '@/shared/components/ads/BlogAdSense'
import { BlogHeader } from '@/features/blog/components/BlogHeader'
import { LandingFooter } from '@/shared/components/landing/LandingFooter'
import '@/features/blog/blog.css'

function useBlogResourceHints() {
  useEffect(() => {
    const links = [
      { rel: 'preconnect', href: 'https://images.unsplash.com' },
      { rel: 'dns-prefetch', href: 'https://images.unsplash.com' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
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
  return (
    <div className="blog-page landing-page">
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
