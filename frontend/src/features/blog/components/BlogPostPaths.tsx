import { BLOG_READING_PATHS } from '@/content/blog/blog-graph'

type Props = {
  slug: string
}

export function BlogPostPaths({ slug }: Props) {
  const paths = BLOG_READING_PATHS.filter((path) => path.slugs.includes(slug))
  if (paths.length === 0) return null

  return (
    <section className="blog-container blog-defer-section mt-12 max-w-3xl">
      <h2 className="text-lg font-semibold blog-text-navy">Faz parte desta trilha</h2>
      <ul className="mt-3 space-y-2">
        {paths.map((path) => (
          <li key={path.id} className="text-sm blog-text-body">
            <span className="font-medium blog-text-navy">{path.title}</span>
            <span className="mx-2 opacity-50">·</span>
            {path.description}
          </li>
        ))}
      </ul>
    </section>
  )
}
