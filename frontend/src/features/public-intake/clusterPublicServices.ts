import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'

export type PublicServiceCluster = {
  heading: string | null
  items: PublicFirmServiceSummary[]
}

/**
 * Agrupa serviços pelo `publicGroup`, preservando a ordem relativa do catálogo.
 * Sem grupo → heading null (lista plana).
 * Não depende de adjacência: o mesmo grupo não parte em vários accordions.
 */
export function clusterPublicServices(items: PublicFirmServiceSummary[]): PublicServiceCluster[] {
  const clusters: PublicServiceCluster[] = []
  const indexByHeading = new Map<string | null, number>()
  for (const item of items) {
    const heading = String(item.publicGroup || '').trim() || null
    const existingIdx = indexByHeading.get(heading)
    if (existingIdx !== undefined) {
      clusters[existingIdx].items.push(item)
    } else {
      indexByHeading.set(heading, clusters.length)
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
