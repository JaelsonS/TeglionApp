import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const CARDS = [
  {
    pain: 'Tudo espalhado',
    relief:
      'Documentos no WhatsApp, prazos no email, IRS e consultorias em formulários e links soltos. A equipa perde tempo a caçar informação.',
  },
  {
    pain: 'Cliente sem um sítio claro',
    relief:
      'Cada pedido vai por um canal diferente. O cliente não sabe o que falta — e o escritório responde ao mesmo “já enviei?” todos os dias.',
  },
  {
    pain: 'Pagamentos e serviços à parte',
    relief:
      'Marcações, catálogo e cobranças fora da operação. O fecho do mês nunca está no mesmo ecrã que o dinheiro e os pedidos.',
  },
] as const

export function LandingPain() {
  return (
    <section className="landing-section bg-white">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">O escritório não precisa de viver assim</h2>
          <p className="mt-3 text-[15px] text-[#4A5568] sm:text-base">
            Se reconheces este caos, o Teglion existe exactamente para o acabar.
          </p>
        </FadeInView>
        <FadeInStagger className="mt-12 grid gap-5 md:grid-cols-3">
          {CARDS.map((c) => (
            <FadeInStaggerItem key={c.pain}>
              <article className="landing-card h-full p-6">
                <p className="text-base font-semibold text-[#0F2942]">{c.pain}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-[#4A5568]">{c.relief}</p>
              </article>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  )
}
