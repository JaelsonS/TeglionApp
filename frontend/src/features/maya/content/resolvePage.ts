import { MAYA_PAGES } from '@/features/maya/content/pages'
import type { MayaPageGuide } from '@/features/maya/content/types'

function pathMatches(page: MayaPageGuide, pathname: string): boolean {
  const prefix = page.pathPrefix
  if (page.exact) {
    return pathname === prefix || pathname === `${prefix}/`
  }
  if (prefix.endsWith('/')) {
    return pathname.startsWith(prefix)
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function resolveMayaPage(pathname: string, search: URLSearchParams): MayaPageGuide | null {
  const matches = MAYA_PAGES.filter((page) => {
    if (!pathMatches(page, pathname)) return false
    if (!page.search) return true
    return search.get(page.search.key) === page.search.value
  })
  if (!matches.length) return null
  matches.sort((a, b) => {
    const bySearch = Number(Boolean(b.search)) - Number(Boolean(a.search))
    if (bySearch) return bySearch
    return b.pathPrefix.length - a.pathPrefix.length
  })
  return matches[0] ?? null
}
