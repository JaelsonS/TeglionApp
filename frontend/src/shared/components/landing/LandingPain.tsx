import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const CARDS = [
  {
    pain: 'Pedidos perdidos entre WhatsApp e email.',
    relief: 'Pedidos formais de documentos, com validação e histórico.',
  },
  {
    pain: 'O cliente não tem um sítio para entregar.',
    relief: 'Um portal onde vê o que falta, envia e fala com o gabinete.',
  },
  {
    pain: 'Avenças e cobranças geridas à parte.',
    relief: 'Matriz de avenças por cliente e recebimentos ligados à operação.',
  },
] as const

export function LandingPain() {
  return (
    <section id="funcionalidades" className="landing-section scroll-mt-24 bg-white">
      <div className="landing-container">
        <FadeInView className="max-w-2xl">
          <p className="landing-kicker">O dia-a-dia de um gabinete</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl">
            Menos perseguição. Mais rasto.
          </h2>
        </FadeInView>
        <FadeInStagger className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-5">
          {CARDS.map((c) => (
            <FadeInStaggerItem key={c.pain}>
              <article className="landing-card landing-pain-card flex h-full flex-col p-5 sm:p-6">
                <p className="text-[15px] font-semibold leading-snug text-[var(--landing-navy)]">
                  {c.pain}
                </p>
                <p className="mt-4 text-[13px] font-semibold uppercase tracking-wide text-[var(--landing-gold)]">
                  Com Teglion
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--landing-muted)] sm:text-[15px]">
                  {c.relief}
                </p>
              </article>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  )
}
