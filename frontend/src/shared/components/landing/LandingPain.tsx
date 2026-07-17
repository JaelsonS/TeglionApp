import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const CARDS = [
  {
    pain: 'Documentos perdidos em e-mail e WhatsApp',
    relief: 'Cada pedido fica registado. O cliente vê o que falta — e a equipa deixa de caçar ficheiros.',
  },
  {
    pain: 'Prazos da AT que só se vêem em cima da hora',
    relief: 'Sabe o que vence esta semana, por cliente, antes de virar multa ou noite em claro.',
  },
  {
    pain: 'O mesmo “já enviei?” todos os dias',
    relief: 'O cliente consulta o estado no portal. Vocês respondem quando há mesmo uma dúvida.',
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
