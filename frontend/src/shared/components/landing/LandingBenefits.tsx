import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const ITEMS = [
  'Fecha o mês 40% mais rápido',
  'Zero documentos perdidos',
  'Clientes mais felizes, menos chamadas',
  'Tudo num separador só',
] as const

export function LandingBenefits() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">O que muda no teu escritório</h2>
        </FadeInView>
        <FadeInStagger className="mt-14 space-y-8">
          {ITEMS.map((line) => (
            <FadeInStaggerItem key={line}>
              <p className="text-center text-2xl font-semibold tracking-tight text-[#0F2942] sm:text-3xl lg:text-4xl">
                {line}
              </p>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  )
}
