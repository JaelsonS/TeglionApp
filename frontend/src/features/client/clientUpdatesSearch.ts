export type UpdatesTab = 'alerts' | 'news'

export function updatesTabFromSearch(searchParams: URLSearchParams): UpdatesTab {
  const tab = searchParams.get('tab')
  return tab === 'news' || tab === 'noticias' ? 'news' : 'alerts'
}

/** Keep `tab=news` when opening/closing an article — dropping it snaps the page back to Alertas. */
export function patchNewsFeedSearchParams(
  prev: URLSearchParams,
  slug: string | null,
): URLSearchParams {
  const next = new URLSearchParams(prev)
  next.set('tab', 'news')
  if (slug) next.set('slug', slug)
  else next.delete('slug')
  return next
}

export function patchUpdatesTabSearchParams(
  prev: URLSearchParams,
  tab: UpdatesTab,
): URLSearchParams {
  const next = new URLSearchParams(prev)
  if (tab === 'news') {
    next.set('tab', 'news')
  } else {
    next.delete('tab')
    next.delete('slug')
  }
  return next
}
