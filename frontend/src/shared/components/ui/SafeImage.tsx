import { useState } from 'react'
import { ImageOff } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

/**
 * Imagem com fallback — evita ícone quebrado quando URL expira ou é storage key inválida.
 */
export function SafeImage({
  src,
  alt = '',
  className,
  fallbackClassName,
}: {
  src?: string | null
  alt?: string
  className?: string
  fallbackClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const invalid = !src || failed || src.startsWith('firm/')

  if (invalid) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-400',
          fallbackClassName || className,
        )}
        aria-hidden
      >
        <ImageOff className="h-5 w-5" />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
