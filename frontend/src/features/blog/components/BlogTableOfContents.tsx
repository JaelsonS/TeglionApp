import type { BlogBlock } from '@/content/blog/types'

type Props = {
  blocks: BlogBlock[]
  sticky?: boolean
}

function slugifyHeading(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/** Índice automático a partir de headings h2/h3. */
export function BlogTableOfContents({ blocks, sticky = false }: Props) {
  const headings = blocks
    .filter((b): b is Extract<BlogBlock, { type: 'h2' | 'h3' }> => b.type === 'h2' || b.type === 'h3')
    .map((h) => ({
      ...h,
      anchor: h.id || slugifyHeading(h.text),
    }))

  if (headings.length < 3) return null

  return (
    <nav className={sticky ? 'blog-toc blog-toc--sticky' : 'blog-toc'} aria-label="Índice do artigo">
      <p className="text-sm font-semibold blog-text-navy">Neste artigo</p>
      <ol className="mt-2 space-y-1 text-sm blog-text-body">
        {headings.map((h) => (
          <li key={`${h.type}-${h.anchor}`} className={h.type === 'h3' ? 'ml-3' : ''}>
            <a href={`#${h.anchor}`} className="hover:blog-text-navy hover:underline">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
