import type { CSSProperties } from 'react'

/**
 * Estilo CSS que reproduz o reposicionamento reversível salvo (ImagePositionEditor.tsx)
 * — mesma fórmula usada no admin e na Página Pública, para o enquadramento ficar
 * idêntico nos dois lugares, em qualquer tamanho de contêiner. Sem focus/zoom salvos
 * (serviço antigo, ou nunca reposicionado), cai para object-cover centrado — o
 * comportamento de sempre.
 */
export function servicePositionedImageStyle(service: {
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
  imageFit?: 'cover' | 'contain' | null
}): CSSProperties {
  const focusX = service.imageFocusX ?? 50
  const focusY = service.imageFocusY ?? 50
  const zoom = service.imageZoom ?? 1
  const fit = service.imageFit === 'contain' ? 'contain' : 'cover'
  return {
    objectFit: fit,
    objectPosition: `${focusX}% ${focusY}%`,
    ...(fit === 'cover' && zoom !== 1
      ? { transform: `scale(${zoom})`, transformOrigin: `${focusX}% ${focusY}%` }
      : {}),
  }
}
