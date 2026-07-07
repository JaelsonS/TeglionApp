import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const CARDS = [
  {
    pain: 'Documentos perdidos em emails e WhatsApp',
    relief: 'Com o TegLion, cada pedido fica registado e o cliente sabe exactamente o que falta entregar.',
  },
  {
    pain: 'Prazos da AT que aparecem em cima da hora',
    relief: 'Com o TegLion, vês o que vence esta semana antes de virar multa.',
  },
  {
    pain: 'Clientes que perguntam o mesmo dez vezes',
    relief: 'Com o TegLion, o cliente consulta o estado no portal e tu respondes no mesmo sítio.',
  },
] as const

export function LandingPain() {
  return (
    <section className="landing-section bg-white">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Reconhece o dia a dia?</h2>
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
