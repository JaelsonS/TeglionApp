import { Link } from 'react-router-dom'

import { blogPostUrl } from '@/content/blog/blog-paths'
import { getBlogPost } from '@/content/blog'
import { BLOG_READING_PATHS } from '@/content/blog/blog-graph'

export function BlogReadingPaths() {
  return (
    <section className="blog-container pb-12" aria-labelledby="reading-paths-title">
      <h2 id="reading-paths-title" className="text-xl font-semibold blog-text-navy">
        Percursos de leitura
      </h2>
      <p className="mt-2 max-w-2xl text-sm blog-text-body">
        Caminhos ordenados — cada artigo liga ao seguinte. Útil se está a começar ou quer aprofundar um tema.
      </p>
      <div className="blog-paths-grid mt-8">
        {BLOG_READING_PATHS.map((path) => (
          <article key={path.id} className="blog-path-card">
            <h3 className="blog-path-card-title">{path.title}</h3>
            <p className="blog-path-card-desc">{path.description}</p>
            <ol className="blog-path-card-list">
              {path.slugs.slice(0, 5).map((slug) => {
                const post = getBlogPost(slug)
                if (!post) return null
                return (
                  <li key={slug}>
                    <Link to={blogPostUrl(slug)} className="blog-path-link">
                      {post.title}
                    </Link>
                  </li>
                )
              })}
            </ol>
            {path.slugs.length > 5 ? (
              <p className="mt-2 text-xs blog-text-body">+ {path.slugs.length - 5} artigos neste percurso</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
