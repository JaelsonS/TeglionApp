import { CreditCard, FileSpreadsheet, Globe2, Package } from 'lucide-react'

import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const OFFERS = [
  {
    icon: Globe2,
    title: 'Página pública do escritório',
    text: 'O teu site no Teglion: marca, serviços e marcação — sem montar landing à parte nem gerir links soltos.',
  },
  {
    icon: Package,
    title: 'Serviços à tua medida',
    text: 'Cria e personaliza o catálogo: consultorias, pacotes e o que o escritório vende no dia a dia.',
  },
  {
    icon: FileSpreadsheet,
    title: 'IRS e pedidos estruturados',
    text: 'Recolhe informação de IRS e outros pedidos dentro do produto — não num formulário Google solto.',
  },
  {
    icon: CreditCard,
    title: 'Pagamentos na plataforma',
    text: 'O cliente final paga o escritório no fluxo de marcação. Cobrança ligada à operação, não a outro sistema.',
  },
] as const

export function LandingPublicOffer() {
  return (
    <section id="pagina-publica" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">
            Do site à cobrança
          </p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Página pública, serviços, IRS e pagamentos
          </h2>
          <p className="mt-3 text-[#4A5568]">
            O que antes vivia em links, email e ferramentas à parte — passa a fazer parte do mesmo
            sistema.
          </p>
        </FadeInView>

        <FadeInStagger className="mt-12 grid gap-5 sm:grid-cols-2">
          {OFFERS.map((item) => {
            const Icon = item.icon
            return (
              <FadeInStaggerItem key={item.title}>
                <article className="landing-card flex h-full gap-4 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F2942] text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-[#0F2942]">{item.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-[#4A5568]">{item.text}</p>
                  </div>
                </article>
              </FadeInStaggerItem>
            )
          })}
        </FadeInStagger>
      </div>
    </section>
  )
}
