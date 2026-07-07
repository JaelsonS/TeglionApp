import { blogPostUrl } from '@/content/blog/blog-paths'
import { BRAND } from '@/shared/config/brand'

export type BlogSharePayload = {
  title: string
  excerpt: string
  slug: string
}

export function blogPostAbsoluteUrl(slug: string): string {
  return `${BRAND.url.replace(/\/+$/, '')}${blogPostUrl(slug)}`
}

/** Texto pré-preenchido para partilha (WhatsApp, Instagram, etc.). */
export function buildBlogShareCaption(post: BlogSharePayload): string {
  const url = blogPostAbsoluteUrl(post.slug)
  const excerpt = post.excerpt.trim()
  return excerpt ? `${post.title}\n\n${excerpt}\n\n${url}` : `${post.title}\n\n${url}`
}

export type BlogShareChannel = 'linkedin' | 'whatsapp' | 'facebook' | 'x' | 'instagram'

export function buildBlogShareHref(channel: BlogShareChannel, post: BlogSharePayload): string | null {
  const url = blogPostAbsoluteUrl(post.slug)
  const caption = buildBlogShareCaption(post)
  const encodedUrl = encodeURIComponent(url)
  const encodedCaption = encodeURIComponent(caption)
  const encodedTitle = encodeURIComponent(post.title)

  switch (channel) {
    case 'linkedin':
      return `https://www.linkedin.com/feed/?shareActive=true&text=${encodedCaption}`
    case 'whatsapp':
      return `https://wa.me/?text=${encodedCaption}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
    case 'x':
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    case 'instagram':
      return null
    default:
      return null
  }
}
