import { Building2, Globe2, Users } from 'lucide-react'

import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { LandingScreenshot } from '@/shared/components/landing/LandingScreenshot'
import { LANDING_SCREENS } from '@/shared/components/landing/landingScreens'

const PILLARS = [
  {
    id: 'gabinete',
    title: 'Painel do gabinete',
    body: 'Carteira, documentos, prazos, IRS, serviços e pagamentos — a operação diária num só sítio.',
    icon: Building2,
    src: LANDING_SCREENS.empresas,
    alt: 'Lista de clientes no Teglion',
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
    src: LANDING_SCREENS.documentosFicheiros,
    alt: 'Documentos e ficheiros no Teglion',
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
    <section id="produto" className="landing-section scroll-mt-24 -mt-6 sm:-mt-10">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="landing-kicker">O produto</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl md:text-[2.5rem]">
            Três espaços. Um sistema.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--landing-muted)] sm:text-base">
            O Teglion vende operação completa para gabinetes em Portugal — não mais uma ferramenta
            por canal.
          </p>
        </FadeInView>

        <FadeInStagger className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-3 lg:gap-8">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <FadeInStaggerItem key={p.id}>
                <article className="landing-proof-pillar">
                  <LandingScreenshot src={p.src} alt={p.alt} />
                  <div className="flex items-start gap-3 px-1">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-navy)]/8 text-[var(--landing-navy)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3>{p.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--landing-muted)] sm:text-[15px]">
                        {p.body}
                      </p>
                    </div>
                  </div>
                </article>
              </FadeInStaggerItem>
            )
          })}
        </FadeInStagger>

        <FadeInView className="mx-auto mt-14 max-w-3xl sm:mt-16">
          <p className="text-center text-sm font-semibold text-[var(--landing-navy)]">
            Incluído no mesmo plano
          </p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
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
