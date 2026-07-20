import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'

import { BlogMonetizationSlot } from '@/features/blog/components/BlogMonetizationSlot'
import { BlogCard } from '@/features/blog/components/BlogCard'
import { BlogCategoryFilter } from '@/features/blog/components/BlogCategoryFilter'
import { BlogLeadMagnet } from '@/features/blog/components/BlogLeadMagnet'
import { BlogNewsletter } from '@/features/blog/components/BlogNewsletter'
import { BlogReadingPaths } from '@/features/blog/components/BlogReadingPaths'
import { useBlogSeo } from '@/features/blog/useBlogSeo'
import { BLOG_POSTS, getFeaturedPosts } from '@/content/blog'
import { BLOG_AUDIENCE_FILTERS, filterBlogPosts } from '@/content/blog/blog-filters'
import type { BlogAudience } from '@/content/blog/types'
import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { LEGAL_DISCLAIMER } from '@/content/blog/shared'
import { blogPostUrl } from '@/content/blog/blog-paths'
import { cn } from '@/shared/lib/utils'

export function BlogIndexPage() {
  useBlogSeo({ index: true })
  const [params, setParams] = useSearchParams()
  const [category, setCategory] = useState(params.get('cat') || 'todos')
  const [audience, setAudience] = useState<'todos' | BlogAudience>(
    (params.get('audience') as BlogAudience) || 'todos',
  )
  const [q, setQ] = useState(params.get('q') || '')

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: BLOG_POSTS.length }
    for (const post of BLOG_POSTS) {
      counts[post.category] = (counts[post.category] ?? 0) + 1
    }
    return counts
  }, [])

  const filtered = useMemo(
    () => filterBlogPosts({ category, audience, q }),
    [category, audience, q],
  )
  const featured = useMemo(() => getFeaturedPosts(4), [])
  const heroPost = featured[0]
  const sideFeatured = featured.slice(1, 4)

  function syncParams(next: { cat?: string; audience?: string; q?: string }) {
    const sp = new URLSearchParams(params)
    const cat = next.cat ?? category
    const aud = next.audience ?? audience
    const query = next.q ?? q
    if (cat && cat !== 'todos') sp.set('cat', cat)
    else sp.delete('cat')
    if (aud && aud !== 'todos') sp.set('audience', aud)
    else sp.delete('audience')
    if (query.trim()) sp.set('q', query.trim())
    else sp.delete('q')
    setParams(sp, { replace: true })
  }

  return (
    <>
      <section className="blog-hero-index">
        <div className="blog-container-wide blog-hero-index-inner">
          <div className="blog-hero-copy">
            <p className="text-sm font-semibold uppercase tracking-wide blog-text-gold">Revista fiscal TegLion</p>
            <h1 className="blog-display mt-3 text-3xl font-semibold blog-text-navy sm:text-4xl lg:text-5xl">
              Contabilidade portuguesa explicada sem rodeios
            </h1>
            <p className="mt-4 max-w-xl text-base blog-text-body sm:text-lg">
              Guias com números, prazos e checklists para independentes, PME e escritórios OCC — conteúdo para decidir
              amanhã de manhã, não para decorar teoria.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary inline-flex">
                Sou escritório — teste grátis
              </Link>
              <Link
                to={blogPostUrl('guia-completo-trabalhador-independente-portugal-2026')}
                className="blog-btn-secondary inline-flex"
              >
                Guia do independente
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-xs blog-text-muted">{LEGAL_DISCLAIMER}</p>
          </div>

          {heroPost ? (
            <div className="blog-hero-feature">
              <BlogCard post={heroPost} featured wide />
            </div>
          ) : null}
        </div>
      </section>

      <div className="blog-container-wide pb-8 pt-2">
        <div className="blog-index-layout">
          <div className="blog-index-main min-w-0">
            <BlogReadingPaths />

            {sideFeatured.length > 0 ? (
              <section className="pb-10" aria-labelledby="featured-posts">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 id="featured-posts" className="text-xl font-semibold blog-text-navy">
                      Em destaque
                    </h2>
                    <p className="mt-1 text-sm blog-text-body">Pilares actualizados — comece por aqui.</p>
                  </div>
                  <p className="text-xs blog-text-muted">{BLOG_POSTS.length} artigos indexados</p>
                </div>
                <div className="blog-card-grid">
                  {sideFeatured.map((post) => (
                    <BlogCard key={post.slug} post={post} featured />
                  ))}
                </div>
              </section>
            ) : null}

            <BlogMonetizationSlot
              className="max-w-3xl"
              seed="blog-index-mid"
              kind="teglion"
              format="horizontal"
            />

            <section className="pb-16" aria-label="Lista de artigos">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--blog-muted)]" />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value)
                      syncParams({ q: e.target.value })
                    }}
                    placeholder="Pesquisar IRS, IVA, Lda, prazos…"
                    className="blog-search-input"
                    aria-label="Pesquisar artigos"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Audiência">
                  {BLOG_AUDIENCE_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setAudience(f.id)
                        syncParams({ audience: f.id })
                      }}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition',
                        audience === f.id
                          ? 'bg-[var(--blog-navy)] text-white'
                          : 'bg-white/80 text-[var(--blog-muted)] ring-1 ring-[color-mix(in_srgb,var(--blog-navy)_12%,transparent)] hover:bg-white',
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <BlogCategoryFilter
                  value={category}
                  onChange={(cat) => {
                    setCategory(cat)
                    syncParams({ cat })
                  }}
                  counts={categoryCounts}
                />
              </div>

              <p className="mb-4 text-sm blog-text-body">
                {filtered.length} {filtered.length === 1 ? 'artigo' : 'artigos'}
                {category !== 'todos' ? ` em «${category}»` : ''}
                {audience !== 'todos' ? ` · ${BLOG_AUDIENCE_FILTERS.find((a) => a.id === audience)?.label}` : ''}
                {q.trim() ? ` · «${q.trim()}»` : ''}
              </p>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed blog-border-subtle bg-white/60 px-6 py-12 text-center">
                  <p className="font-medium blog-text-navy">Nenhum artigo com estes filtros</p>
                  <p className="mt-1 text-sm blog-text-body">Limpe a pesquisa ou escolha outra audiência.</p>
                </div>
              ) : (
                <div className="blog-card-grid blog-card-grid--dense">
                  {filtered.map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="blog-index-rail" aria-label="Laterais do blog">
            <BlogLeadMagnet source="blog-index-lead-magnet" />
            <div className="blog-rail-card">
              <p className="blog-rail-eyebrow">Escritórios</p>
              <p className="blog-rail-title">Software para o dia-a-dia do escritório</p>
              <p className="blog-rail-text mt-2">
                Documentos, prazos e portal do cliente — feito para contabilistas em Portugal.
              </p>
              <Link to={authFirmRegisterUrl()} className="landing-btn-primary mt-3 inline-flex w-full justify-center text-sm">
                Testar 14 dias
              </Link>
              <Link
                to={blogPostUrl('digitalizar-escritorio-contabilidade-portugal')}
                className="mt-2 block text-center text-sm font-medium blog-text-navy underline-offset-2 hover:underline"
              >
                Ler: digitalizar o escritório
              </Link>
            </div>
            <div className="blog-rail-card">
              <p className="blog-rail-eyebrow">Trilhas</p>
              <p className="blog-rail-title">PME e sociedades</p>
              <p className="blog-rail-text mt-2">IRC, abrir Lda e casos de transição ENI → empresa.</p>
              <Link
                to={blogPostUrl('irc-sociedades-lda-portugal-guia')}
                className="mt-3 inline-flex text-sm font-semibold blog-text-navy underline-offset-2 hover:underline"
              >
                Abrir guia IRC / Lda →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <section className="blog-container-wide pb-20">
        <BlogNewsletter source="blog-index" />
      </section>
    </>
  )
}
