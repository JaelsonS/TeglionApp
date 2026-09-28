import type { ReactNode } from 'react'

import type { PublicSiteSectionMediaFields } from '@/shared/types/firmPublicSite'

const SIZE_CLASS = {
  sm: 'max-w-[8rem]',
  md: 'max-w-[12rem]',
  lg: 'max-w-[18rem]',
  full: 'w-full',
} as const

type Props = {
  sectionId?: string
  className?: string
  contentClassName?: string
  backgroundColor?: string | null
  backgroundImageUrl?: string | null
  media?: PublicSiteSectionMediaFields
  children: ReactNode
  imageUrl?: string | null
  imageAlt?: string
}

/** Envolvente partilhada: fundo (cor/imagem) + imagem de conteúdo com posição/tamanho. */
export function PublicSiteSectionLayout({
  sectionId,
  className = 'px-4 py-6',
  contentClassName = 'mx-auto max-w-2xl space-y-3 lg:max-w-4xl',
  backgroundColor,
  backgroundImageUrl,
  media,
  children,
  imageUrl,
  imageAlt = '',
}: Props) {
  const showBgImage = Boolean(media?.showBackgroundImage && backgroundImageUrl)
  const showImage = Boolean(imageUrl && media?.showImage !== false)
  const placement = media?.imagePlacement === 'left' || media?.imagePlacement === 'right' ? media.imagePlacement : 'above'
  const size = media?.imageSize && media.imageSize in SIZE_CLASS ? media.imageSize : 'full'
  const fitClass = media?.imageFit === 'contain' ? 'object-contain' : 'object-cover'

  const imageNode = showImage ? (
    <img
      src={imageUrl!}
      alt={imageAlt}
      loading="lazy"
      className={`rounded-xl ${fitClass} ${SIZE_CLASS[size]} ${placement === 'above' ? 'w-full' : 'shrink-0'}`}
    />
  ) : null

  const inner = (
    <>
      {placement === 'above' ? (
        <>
          {imageNode}
          {children}
        </>
      ) : (
        <div
          className={`flex flex-col gap-4 ${placement === 'right' ? 'lg:flex-row-reverse lg:items-start' : 'lg:flex-row lg:items-start'}`}
        >
          {imageNode}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )}
    </>
  )

  return (
    <section
      id={sectionId}
      className={`relative ${className}`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {showBgImage ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-background/70" />
        </>
      ) : null}
      <div className={`relative ${contentClassName}`}>{inner}</div>
    </section>
  )
}
