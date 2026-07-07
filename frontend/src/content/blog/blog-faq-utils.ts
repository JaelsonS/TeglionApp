import type { BlogBlock } from '@/content/blog/types'

export function extractFaqItems(blocks: BlogBlock[]) {
  return blocks
    .filter((b): b is Extract<BlogBlock, { type: 'faq' }> => b.type === 'faq')
    .flatMap((b) => b.items)
}
