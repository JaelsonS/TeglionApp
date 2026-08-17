export type PortalServiceCluster<T extends { publicGroup?: string | null }> = {
  heading: string | null
  items: T[]
}

/** Agrupa serviços adjacentes com o mesmo `publicGroup`, preservando a ordem. */
export function clusterPortalServices<T extends { publicGroup?: string | null }>(
  items: T[],
): PortalServiceCluster<T>[] {
  const clusters: PortalServiceCluster<T>[] = []
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
