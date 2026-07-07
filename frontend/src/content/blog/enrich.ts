import { PILLAR_FAQ_BLOCKS } from '@/content/blog/pillar-faqs'
import type { BlogPost } from '@/content/blog/types'

export function enrichPost(post: BlogPost): BlogPost {
  const faqBlocks = PILLAR_FAQ_BLOCKS[post.slug]
  if (!faqBlocks?.length) return post
  return { ...post, blocks: [...post.blocks, ...faqBlocks], readMinutes: post.readMinutes + 2 }
}
