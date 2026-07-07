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
    ] as const

    const nodes = links.map(({ rel, href }) => {
      const link = document.createElement('link')
      link.rel = rel
      link.href = href
      document.head.appendChild(link)
      return link
    })

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
