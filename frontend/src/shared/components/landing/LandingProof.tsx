import { Building2, Globe2, Users } from 'lucide-react'

import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_SCREENS } from '@/shared/components/landing/landingScreens'

const PILLARS = [
  {
    id: 'gabinete',
    eyebrow: 'Painel',
    title: 'Painel do gabinete',
    body: 'A equipa vê prioridades, prazos, tarefas e pedidos num só lugar.',
    icon: Building2,
    src: LANDING_SCREENS.dashboard,
    alt: 'Painel operacional do Teglion',
  },
  {
    id: 'portal',
    eyebrow: 'Portal',
    title: 'Portal do cliente',
    body: 'No browser, sem app a instalar. O cliente sabe o que falta e entrega.',
    icon: Users,
    src: LANDING_SCREENS.portalCliente,
    alt: 'Portal do cliente Teglion',
  },
  {
    id: 'publico',
    eyebrow: 'Página pública',
    title: 'Página pública',
    body: 'O site com a marca do gabinete: serviços, marcação e captação.',
    icon: Globe2,
    src: LANDING_SCREENS.paginaPublica,
    alt: 'Página pública de exemplo — Maya Contabilidade, gerada no Teglion',
  },
] as const

export function LandingProof() {
  return (
    <section id="produto" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="max-w-2xl">
          <p className="landing-kicker">Três espaços, um sistema</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight tracking-tight sm:text-4xl">
            Tudo o que o gabinete faz, ligado.
          </h2>
        </FadeInView>

        <FadeInStagger className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3 md:gap-6">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <FadeInStaggerItem key={p.id}>
                <article className="landing-card landing-pillar-card flex h-full flex-col overflow-hidden p-0">
                  <LandingScreenshot
                    src={p.src}
                    alt={p.alt}
                    className="rounded-none border-0 shadow-none"
                  />
                  <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--landing-navy)]/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--landing-navy)]">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {p.eyebrow}
                    </span>
                    <h3 className="text-lg font-bold tracking-tight text-[var(--landing-navy)]">
                      {p.title}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-[var(--landing-muted)] sm:text-[15px]">
                      {p.body}
                    </p>
                  </div>
                </article>
              </FadeInStaggerItem>
            )
          })}
        </FadeInStagger>
      </div>
    </section>
  )
}
