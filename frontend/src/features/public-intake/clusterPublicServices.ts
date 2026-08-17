import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'

export type PublicServiceCluster = {
  heading: string | null
  items: PublicFirmServiceSummary[]
}

/**
 * Agrupa serviços adjacentes com o mesmo `publicGroup`, preservando sort_order.
 * Sem grupo → heading null (lista plana como hoje).
 */
export function clusterPublicServices(items: PublicFirmServiceSummary[]): PublicServiceCluster[] {
  const clusters: PublicServiceCluster[] = []
  for (const item of items) {
    const heading = String(item.publicGroup || '').trim() || null
    const last = clusters[clusters.length - 1]
    if (last && last.heading === heading) {
      last.items.push(item)
    } else {
      clusters.push({ heading, items: [item] })
    }
  }
  return clusters
}

/** Agrupa todos os serviços com slug por `publicGroup` (para menus dropdown). */
export function uniquePublicServiceGroups(items: PublicFirmServiceSummary[]): PublicServiceCluster[] {
  const map = new Map<string, PublicFirmServiceSummary[]>()
  for (const item of items) {
    if (!item.slug) continue
    const heading = String(item.publicGroup || '').trim() || 'Outros'
    const list = map.get(heading)
    if (list) list.push(item)
    else map.set(heading, [item])
  }
  return [...map.entries()].map(([heading, groupItems]) => ({ heading, items: groupItems }))
}
