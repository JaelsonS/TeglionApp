import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'

export function resolvePublicSiteImageUrl(
  imageId: string | null | undefined,
  images: PublicSiteConfig['images'],
  sectionKey?: string,
): string | null {
  const id = String(imageId || '').trim()
  if (!id) return null
  const pools = [...(images.hero || []), ...(images.institutional || [])]
  if (sectionKey && images.bySection?.[sectionKey]) {
    pools.push(...images.bySection[sectionKey])
  }
  return pools.find((img) => img.id === id)?.url || null
}

export function resolveFirstPublicSiteImageUrl(
  imageIds: string[],
  images: PublicSiteConfig['images'],
  sectionKey?: string,
): string | null {
  return resolvePublicSiteImageUrl(imageIds[0], images, sectionKey)
}
