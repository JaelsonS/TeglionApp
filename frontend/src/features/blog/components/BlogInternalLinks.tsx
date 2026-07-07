import { Link } from 'react-router-dom'

import { blogPostUrl } from '@/content/blog/blog-paths'
import { getBlogPost } from '@/content/blog'
import type { BlogBlock } from '@/content/blog/types'

type Props = {
  block: Extract<BlogBlock, { type: 'internalLinks' }>
}

export function BlogInternalLinks({ block }: Props) {
  const posts = block.slugs
    .map((slug) => getBlogPost(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  if (posts.length === 0) return null

  return (
    <section className="blog-internal-links" aria-label={block.title}>
      <h2 className="blog-internal-links-title">{block.title}</h2>
      {block.intro ? <p className="blog-internal-links-intro">{block.intro}</p> : null}
      <ul className="blog-internal-links-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link to={blogPostUrl(post.slug)} className="blog-internal-links-item">
              <span className="blog-internal-links-cat">{post.category}</span>
              <span className="blog-internal-links-name">{post.title}</span>
              <span className="blog-internal-links-meta">{post.readMinutes} min · {post.excerpt.slice(0, 72)}…</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
