import { useState } from 'react'

import {
  blogCardImageUrl,
  blogCoverLcpUrl,
  blogCoverSrcSet,
  blogImageUrl,
  resolveBlogImageOnError,
} from '@/features/blog/blog-images'
import { cn } from '@/shared/lib/utils'

type Props = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'high' | 'low' | 'auto'
  sizes?: string
  itemProp?: string
  /** Capa do artigo — srcset responsivo e LCP optimizado. */
  cover?: boolean
}

export function BlogResponsiveImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  fetchPriority,
  sizes,
  itemProp,
  cover = false,
}: Props) {
  const initial = cover
    ? blogCoverLcpUrl(src)
    : width <= 640
      ? blogCardImageUrl(src)
      : blogImageUrl(src, width, height)
  const [current, setCurrent] = useState(initial)

  return (
    <img
      src={current}
      srcSet={cover ? blogCoverSrcSet(src) : undefined}
      alt={alt}
      width={width}
      height={height}
      className={cn(className)}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      sizes={
        sizes ??
        (cover ? '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 896px' : undefined)
      }
      itemProp={itemProp}
      onError={() => {
        setCurrent((prev) => resolveBlogImageOnError(prev))
      }}
    />
  )
}
