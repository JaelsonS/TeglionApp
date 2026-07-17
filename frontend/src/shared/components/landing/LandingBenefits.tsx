import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const ITEMS = [
  {
    title: 'Menos tempo a pedir o mesmo documento',
    text: 'O pedido fica no portal. O cliente vê o que falta. A equipa deixa de repetir o mesmo e-mail.',
  },
  {
    title: 'Prazos à vista — não à última hora',
    text: 'Sabe o que vence esta semana e o que já está entregue, cliente a cliente.',
  },
  {
    title: 'Menos chamadas “já enviei?”',
    text: 'O cliente acompanha o estado sozinho. Vocês respondem quando há mesmo algo a decidir.',
  },
  {
    title: 'Tudo no mesmo sítio',
    text: 'Documentos, mensagens e obrigações no fluxo do escritório — não espalhados por cinco apps.',
  },
] as const

export function LandingBenefits() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">O que muda no dia a dia</h2>
          <p className="mt-3 text-[#4A5568]">
            Resultados que um escritório sente na primeira semana — não promessas vazias.
          </p>
        </FadeInView>
        <FadeInStagger className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <FadeInStaggerItem key={item.title}>
              <article className="landing-card h-full p-6 text-left">
                <h3 className="text-lg font-semibold text-[#0F2942]">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#4A5568]">{item.text}</p>
              </article>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  )
}
