import { BLOG_CATEGORIES } from '@/content/blog/blog-graph'
import { cn } from '@/shared/lib/utils'

type Props = {
  value: string
  onChange: (category: string) => void
  counts: Record<string, number>
}

export function BlogCategoryFilter({ value, onChange, counts }: Props) {
  return (
    <div className="blog-category-filter" role="tablist" aria-label="Filtrar por categoria">
      {BLOG_CATEGORIES.map((cat) => {
        const active = value === cat.id
        const count = counts[cat.id] ?? 0
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn('blog-category-chip', active && 'blog-category-chip-active')}
            onClick={() => onChange(cat.id)}
          >
            {cat.label}
            <span className="blog-category-count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
