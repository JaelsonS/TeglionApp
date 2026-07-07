import { BlogResponsiveImage } from '@/features/blog/components/BlogResponsiveImage'
import type { BlogPost } from '@/content/blog/types'

type Props = {
  coverImage: BlogPost['coverImage']
}

export function BlogCoverImage({ coverImage }: Props) {
  return (
    <figure className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl bg-[color-mix(in_srgb,var(--blog-navy)_6%,white)]">
      <BlogResponsiveImage
        src={coverImage.src}
        alt={coverImage.alt}
        width={coverImage.width ?? 1200}
        height={coverImage.height ?? 630}
        className="aspect-[1200/630] w-full object-cover"
        loading="eager"
        fetchPriority="high"
        itemProp="image"
        cover
      />
    </figure>
  )
}
