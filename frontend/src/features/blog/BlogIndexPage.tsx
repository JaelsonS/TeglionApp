import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { BlogMonetizationSlot } from '@/features/blog/components/BlogMonetizationSlot'
import { BlogCard } from '@/features/blog/components/BlogCard'
import { BlogCategoryFilter } from '@/features/blog/components/BlogCategoryFilter'
import { BlogNewsletter } from '@/features/blog/components/BlogNewsletter'
import { BlogReadingPaths } from '@/features/blog/components/BlogReadingPaths'
import { useBlogSeo } from '@/features/blog/useBlogSeo'
import { BLOG_POSTS, getFeaturedPosts, getPostsByCategory } from '@/content/blog'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { LEGAL_DISCLAIMER } from '@/content/blog/shared'

export function BlogIndexPage() {
  useBlogSeo({ index: true })
  const [category, setCategory] = useState('todos')

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: BLOG_POSTS.length }
    for (const post of BLOG_POSTS) {
      counts[post.category] = (counts[post.category] ?? 0) + 1
    }
    return counts
  }, [])

  const filtered = useMemo(() => getPostsByCategory(category), [category])
  const featured = useMemo(() => getFeaturedPosts(3), [])

  return (
    <>
      <section className="blog-container pb-8 pt-28">
        <p className="text-sm font-semibold uppercase tracking-wide blog-text-gold">Blog TegLion</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold blog-text-navy sm:text-4xl">
          Contabilidade e fiscalidade explicadas sem complicar
        </h1>
        <p className="mt-4 max-w-2xl blog-text-body">
          Guias para freelancers, escritórios de contabilidade, estudantes OCC e quem quer entender — IRS, IVA, prazos e
          ferramentas. Trilhas de leitura ligam artigo a artigo; conteúdo educativo que não substitui um contador
          certificado.
        </p>
        <p className="mt-3 max-w-xl text-sm blog-text-body">
          <Link to="/blog/digitalizar-escritorio-contabilidade-portugal" className="font-medium blog-text-navy hover:underline">
            Contabilidade organizada
          </Link>
          {' · '}
          <Link to="/blog/estudar-contabilidade-portugal-guia-estudantes" className="font-medium blog-text-navy hover:underline">
            Estudantes
          </Link>
          {' · '}
          <Link to="/blog/contabilidade-explicada-leigos-portugal" className="font-medium blog-text-navy hover:underline">
            Contabilidade explicada para quem quer entender
          </Link>
        </p>
        <p className="mt-3 max-w-2xl text-xs blog-text-muted">{LEGAL_DISCLAIMER}</p>
        <p className="mt-2 max-w-2xl text-xs blog-text-muted">
          Alguns artigos incluem links de afiliado (Hotmart, Amazon). Podemos receber comissão — sem custo extra para
          si. Como Afiliado da Amazon, ganhamos por compras elegíveis.
        </p>
        <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-6 inline-flex">
          Sou escritório — testar TegLion grátis
        </Link>
      </section>

      <BlogReadingPaths />

      {featured.length > 0 ? (
        <section className="blog-container pb-12" aria-labelledby="featured-posts">
          <h2 id="featured-posts" className="text-xl font-semibold blog-text-navy">
            Em destaque
          </h2>
          <p className="mt-1 text-sm blog-text-body">Guias completos e mapas de leitura — comece por aqui.</p>
          <div className="blog-card-grid mt-6">
            {featured.map((post) => (
              <BlogCard key={post.slug} post={post} featured />
            ))}
          </div>
        </section>
      ) : null}

      <BlogMonetizationSlot
        className="blog-container max-w-3xl"
        seed="blog-index-mid"
        kind="teglion"
        format="horizontal"
      />

      <section className="blog-container pb-16" aria-label="Lista de artigos">
        <div className="mb-8">
          <BlogCategoryFilter value={category} onChange={setCategory} counts={categoryCounts} />
        </div>
        <p className="mb-4 text-sm blog-text-body">
          {filtered.length} {filtered.length === 1 ? 'artigo' : 'artigos'}
          {category !== 'todos' ? ` em «${category}»` : ''}
        </p>
        <div className="blog-card-grid">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <section className="blog-container pb-20">
        <BlogNewsletter />
      </section>
    </>
  )
}
