import { Link, Navigate, useParams } from 'react-router-dom'

import {
  getManualChapter,
  isSafeManualSlug,
  listManualChapters,
} from '@/content/manual'
import { ManualBlocks } from '@/features/manual/ManualBlocks'
import { ManualMayaProspect } from '@/features/manual/ManualMayaProspect'
import { useManualSeo } from '@/features/manual/useManualSeo'
import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { MayaAvatar } from '@/features/maya'

export function ManualChapterPage() {
  const { slug } = useParams<{ slug: string }>()
  const safe = isSafeManualSlug(slug) ? slug! : null
  const chapter = safe ? getManualChapter(safe) : null
  const all = listManualChapters()
  const idx = chapter ? all.findIndex((c) => c.slug === chapter.slug) : -1
  const prev = idx > 0 ? all[idx - 1] : null
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null

  useManualSeo({
    title: chapter?.title || 'Capítulo',
    description: chapter?.seoDescription || 'Manual do utilizador Teglion.',
    path: chapter ? `/manual/${chapter.slug}` : '/manual',
  })

  if (!safe || !chapter) {
    return <Navigate to="/manual" replace />
  }

  return (
    <LandingMarketingShell
      title={`${chapter.title} · Manual Teglion`}
      description={chapter.seoDescription}
      path={`/manual/${chapter.slug}`}
    >
      <article className="landing-container px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-[#4A5568]">
            <Link to="/manual" className="font-medium text-brand hover:underline">
              Manual
            </Link>
            <span aria-hidden> · </span>
            Capítulo {String(chapter.number).padStart(2, '0')}
          </p>
          <div className="mt-4 flex items-start gap-3">
            <MayaAvatar size="md" variant="md" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[#0B3A6E]">{chapter.title}</h1>
              <p className="mt-1 text-[#4A5568]">{chapter.subtitle}</p>
            </div>
          </div>

          <div className="mt-8">
            <ManualBlocks blocks={chapter.blocks} />
          </div>

          <div className="mt-10">
            <ManualMayaProspect />
          </div>

          <nav className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#0B3A6E]/10 pt-6 text-sm">
            {prev ? (
              <Link to={`/manual/${prev.slug}`} className="font-medium text-brand hover:underline">
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/manual/${next.slug}`} className="font-medium text-brand hover:underline">
                {next.title} →
              </Link>
            ) : (
              <Link to="/manual" className="font-medium text-brand hover:underline">
                Índice
              </Link>
            )}
          </nav>
        </div>
      </article>
    </LandingMarketingShell>
  )
}
