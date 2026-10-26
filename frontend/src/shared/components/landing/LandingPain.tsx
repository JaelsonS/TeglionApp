import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const CARDS = [
  {
    pain: 'Tudo espalhado',
    relief:
      'Documentos no WhatsApp, prazos no email, IRS em links soltos. A equipa perde tempo a caçar informação.',
  },
  {
    pain: 'Cliente sem sítio claro',
    relief:
      'Cada pedido por um canal diferente. O cliente não sabe o que falta — e o gabinete responde ao mesmo “já enviei?”.',
  },
  {
    pain: 'Cobranças à parte',
    relief:
      'Marcações, catálogo e pagamentos fora da operação. O fecho do mês nunca está no mesmo ecrã que o dinheiro.',
  },
] as const

export function LandingPain() {
  return (
    <section id="funcionalidades" className="landing-section scroll-mt-24 bg-white">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="landing-kicker">O problema</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl">
            O caos não é normal — é falta de um sistema
          </h2>
          <p className="mt-4 text-[15px] text-[var(--landing-muted)] sm:text-base">
            O Teglion existe para gabinetes que querem operação, cliente e oferta no mesmo SaaS.
          </p>
        </FadeInView>
        <FadeInStagger className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-3 md:gap-5">
          {CARDS.map((c) => (
            <FadeInStaggerItem key={c.pain}>
              <article className="landing-card h-full p-5 sm:p-6">
                <p className="landing-display text-lg font-semibold text-[var(--landing-navy)]">{c.pain}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--landing-muted)] sm:text-[15px]">
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
