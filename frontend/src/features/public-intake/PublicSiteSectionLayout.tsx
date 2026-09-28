import type { ReactNode } from 'react'

import {
  sectionBackgroundPositionedStyle,
  sectionContentPositionedStyle,
} from '@/features/public-intake/publicSiteSectionMedia'
import type { PublicSiteSectionMediaFields } from '@/shared/types/firmPublicSite'
import { servicePositionedImageStyle } from '@/shared/utils/servicePositionedImageStyle'

const SIZE_CLASS = {
  sm: 'max-w-[8rem]',
  md: 'max-w-[12rem]',
  lg: 'max-w-[18rem]',
  full: 'w-full',
} as const

const SIZE_MIN_H = {
  sm: 'min-h-[8rem]',
  md: 'min-h-[12rem]',
  lg: 'min-h-[16rem]',
  full: 'min-h-[12rem]',
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
  const contentStyle = media ? servicePositionedImageStyle(sectionContentPositionedStyle(media)) : undefined
  const bgStyle = media ? servicePositionedImageStyle(sectionBackgroundPositionedStyle(media)) : undefined

  const imageNode = showImage ? (
    <div
      className={`overflow-hidden rounded-xl ${SIZE_CLASS[size]} ${SIZE_MIN_H[size]} ${
        placement === 'above' ? 'w-full' : 'shrink-0'
      }`}
    >
      <img
        src={imageUrl!}
        alt={imageAlt}
        loading="lazy"
        className="h-full w-full select-none"
        style={contentStyle}
        draggable={false}
      />
    </div>
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
          className={`ps-section-media-inner flex flex-col gap-4 ${
            placement === 'right' ? 'ps-section-media-inner--right' : 'ps-section-media-inner--left'
          }`}
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
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
            <img
              src={backgroundImageUrl!}
              alt=""
              className="h-full w-full select-none"
              style={bgStyle}
              draggable={false}
            />
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-background/70" />
        </>
      ) : null}
      <div className={`relative ${contentClassName}`}>{inner}</div>
    </section>
  )
}
