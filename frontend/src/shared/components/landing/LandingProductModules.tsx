import { FIRM_NAV_GROUPS } from '@/features/firm/firmNavConfig'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { LANDING_MODULE_COPY } from '@/shared/components/landing/landingModuleCopy'

export function LandingProductModules() {
  return (
    <section id="modulos" className="landing-section scroll-mt-24 bg-[#FAFAF7]">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">Menu real do gabinete</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">O que o Teglion já inclui</h2>
          <p className="mt-3 text-[#4A5568]">
            Os mesmos módulos que vê no painel — sem prometer emissão AT nem funcionalidades que ainda não
            existem.
          </p>
        </FadeInView>

        <div className="mt-12 space-y-10">
          {FIRM_NAV_GROUPS.map((group) => (
            <FadeInStagger key={group.id} className="space-y-4">
              <FadeInStaggerItem>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0B3A6E]/70">
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B3A6E]/8 text-[#0B3A6E]">
                          <Icon className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#0B3A6E]">{item.labelDefault}</h4>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#4A5568] sm:text-[14px]">
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
      </div>
    </section>
  )
}
