import { Link } from 'react-router-dom'

import { listManualChapters } from '@/content/manual'
import { ManualMayaProspect } from '@/features/manual/ManualMayaProspect'
import { useManualSeo } from '@/features/manual/useManualSeo'
import { FadeInView } from '@/shared/components/landing/FadeInView'
import { LandingMarketingShell } from '@/shared/components/landing/LandingMarketingShell'
import { MayaAvatar } from '@/features/maya'
import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

const STATUS_LABEL = {
  available: 'Disponível',
  partial: 'Parcial',
  planned: 'Em preparação',
} as const

export function ManualIndexPage() {
  const chapters = listManualChapters()
  useManualSeo({
    title: 'Manual do utilizador',
    description:
      'Manual completo do Teglion na voz da Maya: primeiros passos, clientes, documentos, avenças, portal e segurança.',
    path: '/manual',
  })

  return (
    <LandingMarketingShell
      title={`Manual do utilizador · ${BRAND.name}`}
      description="Guia completo do Teglion na voz da Maya: primeiros passos, clientes, documentos, avenças e segurança."
      path="/manual"
    >
      <div className="landing-container px-5 py-10 sm:px-8 sm:py-14">
        <FadeInView>
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3">
              <MayaAvatar size="lg" variant="md" />
              <div>
                <p className="text-sm font-medium text-brand">Maya · Manual {BRAND.name}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-[#0F2942] sm:text-4xl">
                  O guia completo, na minha voz
                </h1>
              </div>
            </div>
            <p className="mt-4 text-base leading-relaxed text-[#4A5568]">
              Sou a Maya. Aqui explico o Teglion como se estivéssemos no mesmo ecrã — para quem ainda
              está a descobrir o produto e para quem já trabalha no escritório ou no portal do
              cliente. Sem jargão inútil. Sem promessas que o produto ainda não cumpre.
            </p>
            <p className="mt-3">
              <Link to="/" className="text-sm font-medium text-brand hover:underline">
                ← Voltar ao site
              </Link>
            </p>
          </div>
        </FadeInView>

        <div className="mx-auto mt-8 max-w-3xl">
          <ManualMayaProspect />
        </div>

        <ol className="mx-auto mt-10 max-w-3xl space-y-3">
          {chapters.map((ch) => (
            <li key={ch.slug}>
              <Link
                to={`/manual/${ch.slug}`}
                className="flex items-start gap-3 rounded-2xl border border-[#0F2942]/10 bg-white/80 px-4 py-3.5 transition hover:border-brand/40 hover:bg-white"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F2942]/5 text-xs font-semibold tabular-nums text-[#0F2942]">
                  {String(ch.number).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#0F2942]">{ch.title}</span>
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                        ch.status === 'available' && 'border-emerald-200 text-emerald-800',
                        ch.status === 'partial' && 'border-amber-200 text-amber-900',
                        ch.status === 'planned' && 'border-slate-200 text-slate-600',
                      )}
                    >
                      {STATUS_LABEL[ch.status]}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-[#4A5568]">{ch.subtitle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </LandingMarketingShell>
  )
}
