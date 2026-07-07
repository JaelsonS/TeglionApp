export const BLOG_BASE_PATH = '/blog'

export function blogPostUrl(slug: string) {
  return `${BLOG_BASE_PATH}/${slug}`
}
