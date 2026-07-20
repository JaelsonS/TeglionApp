import { PILLAR_FAQ_BLOCKS } from '@/content/blog/pillar-faqs'
import type { BlogPost } from '@/content/blog/types'

/**
 * Enrichment mínimo: só FAQs pillar específicas do slug.
 * Removido o template genérico “Plano 30 dias / playbook” que inflacionava
 * readMinutes (+13) e diluía a confiança editorial.
 */
export function enrichPost(post: BlogPost): BlogPost {
  const faqBlocks = PILLAR_FAQ_BLOCKS[post.slug] ?? []
  if (!faqBlocks.length) return post

  const faqMinutes = Math.min(3, Math.ceil(faqBlocks.length * 0.5))
  return {
    ...post,
    blocks: [...post.blocks, ...faqBlocks],
    readMinutes: Math.max(post.readMinutes, post.readMinutes + faqMinutes),
  }
}
