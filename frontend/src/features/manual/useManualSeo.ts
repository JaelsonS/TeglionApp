import { useEffect } from 'react'

import { BRAND } from '@/shared/config/brand'

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

export function useManualSeo(opts: { title: string; description: string; path: string }) {
  useEffect(() => {
    const fullTitle = `${opts.title} · Manual · ${BRAND.name}`
    document.title = fullTitle
    upsertMeta('description', opts.description)
    upsertMeta('og:title', fullTitle, 'property')
    upsertMeta('og:description', opts.description, 'property')
    upsertMeta('og:type', 'article', 'property')
    upsertMeta('twitter:title', fullTitle)
    upsertMeta('twitter:description', opts.description)
    const canonical = `https://www.teglion.com${opts.path}`
    let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical
  }, [opts.title, opts.description, opts.path])
}
