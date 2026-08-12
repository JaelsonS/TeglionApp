import {
  Bell,
  CalendarDays,
  FileCheck,
  FolderOpen,
  HardDrive,
  LayoutDashboard,
  MessagesSquare,
  Smartphone,
  Sparkles,
  Users,
} from 'lucide-react'

import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'

const FEATURES = [
  {
    icon: Users,
    title: 'Carteira de clientes',
    text: 'Empresas, regimes e estado — a base do escritório num só painel.',
  },
  {
    icon: CalendarDays,
    title: 'Obrigações e prazos',
    text: 'O que vence esta semana, por cliente, antes da pressão do fecho.',
  },
  {
    icon: LayoutDashboard,
    title: 'Tarefas da equipa',
    text: 'Kanban e calendário para o trabalho interno não ficar no chat.',
  },
  {
    icon: FolderOpen,
    title: 'Pedidos de documentos',
    text: 'Pede o que falta, valida e arquiva — sem pastas no email.',
  },
  {
    icon: FileCheck,
    title: 'Validação com rasto',
    text: 'Cada ficheiro fica datado: o que pediste e o que o cliente enviou.',
  },
  {
    icon: MessagesSquare,
    title: 'Mensagens no produto',
    text: 'Escritório ↔ cliente no mesmo fluxo, sem WhatsApp perdido.',
  },
  {
    icon: Smartphone,
    title: 'Portal do cliente',
    text: 'O cliente entrega e acompanha no browser — telemóvel ou computador.',
  },
  {
    icon: HardDrive,
    title: 'Google Calendar e Drive',
    text: 'Agenda e ficheiros ligados à operação do escritório.',
  },
  {
    icon: Bell,
    title: 'Alertas e comunicados',
    text: 'Avisos quando há prazo ou documento — sem caçar na caixa de entrada.',
  },
] as const

export function LandingFeatures() {
  return (
    <section id="funcionalidades" className="landing-section scroll-mt-24 bg-white">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#C9932E]">Já disponível</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Tudo o que o escritório precisa no dia a dia</h2>
          <p className="mt-3 text-[#4A5568]">
            Funcionalidades reais — não uma lista de “em desenvolvimento”.
          </p>
        </FadeInView>

        <FadeInStagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item) => {
            const Icon = item.icon
            return (
              <FadeInStaggerItem key={item.title}>
                <article className="landing-card flex h-full flex-col p-5 sm:p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2942]/5 text-[#0F2942]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[#0F2942]">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#4A5568] sm:text-[15px]">{item.text}</p>
                </article>
              </FadeInStaggerItem>
            )
          })}
        </FadeInStagger>

        <FadeInView delay={0.05} className="mt-8">
          <div className="flex flex-col gap-3 rounded-[14px] border border-dashed border-[#0F2942]/20 bg-[#FAFAF7] px-5 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9932E]/15 text-[#0F2942]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-[#0F2942]">IA no contexto do escritório</h3>
                <span className="rounded-md bg-[#0F2942]/8 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0F2942]">
                  Em breve
                </span>
              </div>
              <p className="mt-1 text-[14px] leading-relaxed text-[#4A5568] sm:text-[15px]">
                Apoio a classificar documentos, rascunhar comunicações e acelerar o fecho do mês — dentro
                do Teglion, não noutro chat genérico.
              </p>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  )
}
