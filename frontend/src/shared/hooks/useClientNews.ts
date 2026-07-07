import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { clientPortalContabilApi } from '@/infrastructure/api'
import { countUnreadNews, useClientNewsReadVersion } from '@/shared/utils/clientNewsRead'
import type { NewsArticle } from '@/shared/types/contabil'

export const clientNewsQueryKey = ['client', 'news', 'feed'] as const

export function useClientNewsFeed(enabled = true) {
  const query = useQuery({
    queryKey: clientNewsQueryKey,
    queryFn: () =>
      clientPortalContabilApi.listNews() as Promise<{
        items?: NewsArticle[]
        featured?: NewsArticle[]
      }>,
    staleTime: 45_000,
    refetchInterval: 90_000,
    enabled,
  })

  const items = query.data?.items || []
  const featured = query.data?.featured || []
  const readVersion = useClientNewsReadVersion()

  const unreadCount = useMemo(() => {
    const ids = [...items, ...featured]
      .map((a) => a.id || a._id || '')
      .filter(Boolean)
    return countUnreadNews([...new Set(ids)])
  }, [items, featured, readVersion])

  return { ...query, items, featured, unreadCount }
}
