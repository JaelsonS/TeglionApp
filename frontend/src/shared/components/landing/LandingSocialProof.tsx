import { FileCheck, LayoutDashboard, MessagesSquare } from 'lucide-react'

import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const TRUST_STATS = [
  { value: '14 dias', label: 'Teste grátis sem cartão' },
  { value: 'UE', label: 'Dados alojados na Europa' },
  { value: 'RGPD', label: 'Conformidade desde o dia um' },
  { value: '24/7', label: 'Portal cliente sempre disponível' },
] as const

const VALUE_PILLARS = [
  {
    icon: FileCheck,
    title: 'Documentos e prazos',
    text: 'Pedidos de documentos, validação e obrigações fiscais num fluxo único — sem pastas dispersas.',
  },
  {
    icon: LayoutDashboard,
    title: 'Painel do escritório',
    text: 'Vista operacional da carteira: tarefas, alertas e calendário fiscal para fechar o mês com método.',
  },
  {
    icon: MessagesSquare,
    title: 'Portal do cliente',
    text: 'Área dedicada para o cliente enviar ficheiros, ver obrigações e falar com a equipa — com registo de auditoria.',
  },
] as const

type LandingSocialProofProps = {
  className?: string
  showStats?: boolean
}

/** Sinais de confiança factuais — sem depoimentos inventados. */
export function LandingSocialProof({ className, showStats = true }: LandingSocialProofProps) {
  return (
    <section className={className ?? 'landing-section bg-white'}>
      <div className="landing-container">
        {showStats ? (
          <FadeInView className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TRUST_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[#0F2942]/10 bg-[#FAFAF7] px-4 py-5 text-center"
              >
                <p className="text-2xl font-semibold text-[#0F2942]">{stat.value}</p>
                <p className="mt-1 text-xs text-[#4A5568]">{stat.label}</p>
              </div>
            ))}
          </FadeInView>
        ) : null}

        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">Para escritórios em Portugal</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#0F2942] sm:text-4xl">
            Feito para quem fecha contas todos os meses
          </h2>
          <p className="mt-4 text-[#4A5568]">
            O TegLion está em fase inicial — desenhado com contabilistas para organizar clientes, prazos e comunicação,
            sem substituir o software certificado.
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
