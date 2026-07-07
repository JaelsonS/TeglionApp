import type { BlogBlock } from '@/content/blog/types'

type Props = {
  blocks: BlogBlock[]
}

/** Índice automático a partir de headings h2/h3. */
export function BlogTableOfContents({ blocks }: Props) {
  const headings = blocks.filter((b): b is Extract<BlogBlock, { type: 'h2' | 'h3' }> =>
    b.type === 'h2' || b.type === 'h3',
  )

  if (headings.length < 3) return null

  return (
    <nav className="blog-toc" aria-label="Índice do artigo">
      <p className="text-sm font-semibold blog-text-navy">Neste artigo</p>
      <ol className="mt-2 space-y-1 text-sm blog-text-body">
        {headings.map((h) => (
          <li key={`${h.type}-${h.id || h.text}`} className={h.type === 'h3' ? 'ml-4' : ''}>
            <a href={`#${h.id || ''}`} className="hover:blog-text-navy hover:underline">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
