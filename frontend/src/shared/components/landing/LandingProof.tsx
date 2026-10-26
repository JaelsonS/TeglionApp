import { Building2, Globe2, Users } from 'lucide-react'

import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_SCREENS } from '@/shared/components/landing/landingScreens'

const PILLARS = [
  {
    id: 'gabinete',
    title: 'Painel do gabinete',
    body: 'Clientes, documentos, prazos, IRS, serviços e pagamentos — a operação diária num só sítio.',
    icon: Building2,
    src: LANDING_SCREENS.dashboard,
    alt: 'Painel operacional do Teglion',
  },
  {
    id: 'portal',
    title: 'Portal do cliente',
    body: 'O cliente entrega ficheiros, vê o que falta e fala consigo — no browser, sem instalar app.',
    icon: Users,
    src: LANDING_SCREENS.portalCliente,
    alt: 'Portal do cliente Teglion',
  },
  {
    id: 'publico',
    title: 'Página pública',
    body: 'Site do gabinete com a sua marca: catálogo, marcações e captação — ligado à mesma carteira.',
    icon: Globe2,
    src: LANDING_SCREENS.empresas,
    alt: 'Carteira de clientes no Teglion',
  },
] as const

const HIGHLIGHTS = [
  'Documentos com rasto do pedido à validação',
  'Obrigações e tarefas da equipa no mesmo fluxo',
  'Serviços, IRS e leads da página pública',
  'Pagamentos do cliente final na plataforma',
  'Agenda com clientes e Google Calendar opcional',
  '14 dias grátis — depois mensal ou anual',
] as const

export function LandingProof() {
  return (
    <section id="produto" className="landing-section scroll-mt-24 -mt-4 sm:-mt-8">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="landing-kicker">O produto</p>
          <h2 className="mt-3 text-[1.75rem] leading-tight tracking-tight sm:text-4xl">
            Três espaços. Um sistema.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--landing-muted)] sm:text-base">
            Operação completa para o gabinete — sem uma ferramenta por canal.
          </p>
        </FadeInView>

        <FadeInStagger className="mt-12 grid gap-8 lg:mt-14 lg:grid-cols-3 lg:gap-6">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <FadeInStaggerItem key={p.id}>
                <article className="landing-card flex h-full flex-col overflow-hidden p-0">
                  <LandingScreenshot
                    src={p.src}
                    alt={p.alt}
                    className="rounded-none border-0 shadow-none"
                  />
                  <div className="flex flex-1 items-start gap-3 p-4 sm:p-5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-navy)]/8 text-[var(--landing-navy)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold tracking-tight sm:text-lg">{p.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--landing-muted)]">
                        {p.body}
                      </p>
                    </div>
                  </div>
                </article>
              </FadeInStaggerItem>
            )
          })}
        </FadeInStagger>

        <FadeInView className="mx-auto mt-12 max-w-3xl sm:mt-14">
          <p className="text-center text-sm font-semibold text-[var(--landing-navy)]">
            Incluído no mesmo plano
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 rounded-xl border border-[var(--landing-navy)]/8 bg-white px-3.5 py-2.5 text-[14px] text-[var(--landing-body)]"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--landing-gold)]"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </FadeInView>
      </div>
    </section>
  )
}
