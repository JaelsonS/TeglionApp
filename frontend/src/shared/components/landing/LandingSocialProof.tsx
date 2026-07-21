import { FileCheck, LayoutDashboard, MessagesSquare } from 'lucide-react'

import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

/** Sinais de confiança — benefício primeiro, sem jargão técnico. */
const TRUST_STATS = [
  {
    title: 'Sem risco',
    text: '14 dias para usar o escritório completo. Não pedimos cartão.',
  },
  {
    title: 'Escritório no controlo total',
    text: 'Total organização e controlo do seu escritório.',
  },
  {
    title: 'Rasto claro',
    text: 'Cada pedido e cada ficheiro ficam datados — sabe o que pediu e o que o cliente enviou.',
  },
  {
    title: 'Cliente autónomo',
    text: 'Portal aberto a qualquer hora — menos chamadas e WhatsApps perdidos.',
  },
] as const

const VALUE_PILLARS = [
  {
    icon: FileCheck,
    title: 'Documentos que não se perdem',
    text: 'Pede o que falta, o cliente envia no portal, e a equipa valida no mesmo sítio. Fim às pastas no e-mail e no telemóvel.',
  },
  {
    icon: LayoutDashboard,
    title: 'O mês sob controlo',
    text: 'Vê quem está atrasado, o que vence esta semana e o que já foi entregue — antes da pressão do fecho.',
  },
  {
    icon: MessagesSquare,
    title: 'O cliente sabe o que fazer',
    text: 'Área clara para enviar ficheiros, acompanhar pedidos e falar consigo. Menos “já enviei” sem rasto.',
  },
] as const

type LandingSocialProofProps = {
  className?: string
  showStats?: boolean
}

export function LandingSocialProof({ className, showStats = true }: LandingSocialProofProps) {
  return (
    <section className={className ?? 'landing-section bg-white'}>
      <div className="landing-container">
        {showStats ? (
          <FadeInView className="mb-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_STATS.map((stat) => (
              <div
                key={stat.title}
                className="rounded-xl border border-[#0F2942]/10 bg-[#FAFAF7] px-5 py-5 text-left"
              >
                <p className="text-sm font-semibold text-[#0F2942]">{stat.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[#4A5568]">{stat.text}</p>
              </div>
            ))}
          </FadeInView>
        ) : null}

        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">
            Feito para escritórios de contabilidade
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#0F2942] sm:text-4xl">
            Menos caos. Mais fechos a tempo.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#4A5568]">
            O Teglion organiza clientes, documentos e prazos num só sítio — para a equipa trabalhar com
            método e o cliente deixar de perguntar “já enviei?”.
          </p>
        </FadeInView>

        <FadeInStagger className="mt-12 grid gap-5 md:grid-cols-3">
          {VALUE_PILLARS.map((item) => {
            const Icon = item.icon
            return (
              <FadeInStaggerItem key={item.title}>
                <article className="landing-card flex h-full flex-col p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2942]/5 text-[#0F2942]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#0F2942]">{item.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[#4A5568]">{item.text}</p>
                </article>
              </FadeInStaggerItem>
            )
          })}
        </FadeInStagger>
      </div>
    </section>
  )
}
