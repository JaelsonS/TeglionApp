import { FIRM_NAV_GROUPS } from '@/features/firm/firmNavConfig'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { LANDING_MODULE_COPY } from '@/shared/components/landing/landingModuleCopy'

/** Grupos do menu firm relevantes para a landing (sem Conta Teglion / Definições densas). */
const LANDING_GROUP_IDS = new Set(['clients', 'operations', 'comms'])

export function LandingProductModules() {
  const groups = FIRM_NAV_GROUPS.filter((g) => LANDING_GROUP_IDS.has(g.id))

  return (
    <section id="modulos" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="max-w-2xl">
          <p className="landing-kicker">O que já inclui</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl">
            O sistema completo do gabinete. Hoje.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--landing-muted)] sm:text-base">
            Não são quatro funcionalidades genéricas. É o menu real do Teglion.
          </p>
        </FadeInView>

        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <FadeInStagger key={group.id} className="space-y-4">
              <FadeInStaggerItem>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--landing-navy)]/70">
                  {group.titleDefault}
                </h3>
              </FadeInStaggerItem>
              <FadeInStagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const blurb =
                    LANDING_MODULE_COPY[item.to] ||
                    `${item.labelDefault} — disponível no menu do gabinete.`
                  return (
                    <FadeInStaggerItem key={item.to}>
                      <article className="landing-card flex h-full gap-3 p-4 sm:p-5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-navy)]/8 text-[var(--landing-navy)]">
                          <Icon className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[var(--landing-navy)]">
                            {item.labelDefault}
                          </h4>
                          <p className="mt-1 text-[13px] leading-relaxed text-[var(--landing-muted)] sm:text-[14px]">
                            {blurb}
                          </p>
                        </div>
                      </article>
                    </FadeInStaggerItem>
                  )
                })}
              </FadeInStagger>
            </FadeInStagger>
          ))}
        </div>

        <p className="mt-10 text-[13px] leading-relaxed text-[var(--landing-muted)] sm:text-sm">
          Também em Definições: identidade, editor completo da página pública, Stripe Connect para
          receber dos clientes, equipa e MFA.
        </p>
      </div>
    </section>
  )
}
