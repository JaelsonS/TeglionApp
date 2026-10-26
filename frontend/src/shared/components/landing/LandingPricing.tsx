import { Link } from 'react-router-dom'
import {
  Building2,
  Calculator,
  CalendarCheck,
  Check,
  ClipboardList,
  FileArchive,
  Globe2,
  Inbox,
  Landmark,
  LayoutGrid,
  ListChecks,
  MessageSquare,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'

import { authFirmRegisterUrl } from '@/shared/constants/authPaths'
import { FadeInStagger, FadeInStaggerItem, FadeInView } from '@/shared/components/landing/FadeInView'
import { cn } from '@/shared/lib/utils'
import { usePublicPricing } from '@/shared/config/pricingPlans'

/** O que um único plano Teglion substitui — valor real do produto, não bullet genérico. */
const VALUE_STACK = [
  { icon: LayoutGrid, label: 'Painel do gabinete', detail: 'Prioridades, KPIs e atalhos do dia' },
  { icon: Users, label: 'Carteira de clientes', detail: 'Hub por cliente, NIF, convites ao portal' },
  { icon: Inbox, label: 'Documentos com rasto', detail: 'Pedidos → ficheiros → validação → histórico' },
  { icon: ListChecks, label: 'Tarefas e obrigações', detail: 'Trabalho da equipa + prazos por cliente' },
  { icon: CalendarCheck, label: 'Agendamentos', detail: 'Consultas com clientes e Google Calendar' },
  { icon: Landmark, label: 'Área IRS + Serviços', detail: 'Catálogo, Modelo 3 e leads do site' },
  { icon: ClipboardList, label: 'Calendário fiscal', detail: 'Prazos legais distintos das tarefas' },
  { icon: Calculator, label: 'Calculadoras', detail: 'IVA, IRS, SS, retenção, IMT, IRC (simulação)' },
  { icon: Wallet, label: 'Pagamentos (carteira)', detail: 'Avenças ano×cliente no mesmo sistema' },
  { icon: Building2, label: 'Imóveis e rendas', detail: 'Contratos e recibos no módulo' },
  { icon: FileArchive, label: 'SAF-T (consulta)', detail: 'Importar e ler — sem overclaim de AT' },
  { icon: MessageSquare, label: 'Mensagens e alertas', detail: 'Chat + comunicados no portal' },
  { icon: Globe2, label: 'Página pública', detail: 'Site do gabinete com marca e marcação' },
  { icon: ShieldCheck, label: 'Portal do cliente', detail: 'Entrega, pedidos e serviços no browser' },
] as const

function buildPlans({
  trialDays,
  monthlyLabel,
  yearlyMonthlyLabel,
  yearlyTotalLabel,
}: {
  trialDays: number
  monthlyLabel: string
  yearlyMonthlyLabel: string
  yearlyTotalLabel: string
}) {
  const includedEverywhere = [
    'Painel + portal do cliente + página pública',
    'Documentos, tarefas, obrigações e calendário fiscal',
    'Serviços, Área IRS, agenda e calculadoras',
    'Carteira de avenças, imóveis/rendas e SAF-T consulta',
    'Mensagens, alertas, notícias e equipa ilimitada',
    'Stripe Connect para receber dos clientes (quando activar)',
  ]

  return [
    {
      id: 'trial',
      name: 'Teste completo',
      price: '0 €',
      period: `/ ${trialDays} dias`,
      note: 'Sem cartão no registo · operação real, não demo limitada',
      features: [
        `Os mesmos módulos do plano pago — ${trialDays} dias`,
        'Crie clientes, peça documentos, publique o site',
        'Convide a equipa e um cliente real no portal',
        'Cancele antes do fim — não paga nada',
      ],
      cta: `Começar os ${trialDays} dias grátis`,
      primary: true,
      featured: false,
      order: 'order-1 md:order-1',
    },
    {
      id: 'monthly',
      name: 'Mensal',
      price: monthlyLabel,
      period: '/ mês',
      note: 'Por gabinete · IVA à parte se aplicável · sem fidelização',
      features: [
        ...includedEverywhere,
        'Cancela quando quiser — sem período mínimo',
      ],
      cta: 'Começar com teste grátis',
      primary: false,
      featured: false,
      order: 'order-3 md:order-2',
    },
    {
      id: 'yearly',
      name: 'Anual',
      price: yearlyMonthlyLabel,
      period: '/ mês',
      note: (
        <>
          Cobrado <strong className="text-[var(--landing-navy)]">{yearlyTotalLabel} / ano</strong> ·
          ~2 meses grátis vs mensal
        </>
      ),
      features: [
        ...includedEverywhere,
        'Melhor preço se o gabinete já vai ficar no Teglion',
      ],
      cta: 'Quero o melhor valor',
      primary: true,
      featured: true,
      order: 'order-2 md:order-3',
    },
  ] as const
}

export function LandingPricing() {
  const { trialDays, monthlyLabel, yearlyMonthlyLabel, yearlyTotalLabel } = usePublicPricing()
  const PLANS = buildPlans({ trialDays, monthlyLabel, yearlyMonthlyLabel, yearlyTotalLabel })

  return (
    <section id="precos" className="landing-section scroll-mt-24">
      <div className="landing-container">
        <FadeInView className="mx-auto max-w-3xl text-center px-1">
          <p className="landing-kicker">Preços</p>
          <h2 className="mt-3 text-[1.85rem] leading-tight sm:text-4xl md:text-[2.5rem]">
            Um plano. Todo o sistema do gabinete.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--landing-muted)] sm:text-base">
            Não vende um «pacote básico» e esconde o resto. No Teglion, o trial e o plano pago
            incluem a operação completa: equipa, cliente, site público, documentos, prazos,
            serviços, IRS, carteira e comunicação — no mesmo SaaS.
          </p>
        </FadeInView>

        <FadeInView className="mx-auto mt-10 max-w-5xl sm:mt-12">
          <div className="landing-pricing-value rounded-2xl border border-[var(--landing-navy)]/10 bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--landing-gold)]">
                  Incluído num só plano
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight text-[var(--landing-navy)] sm:text-xl">
                  O potencial real do Teglion — o que o menu do gabinete já tem
                </p>
              </div>
              <p className="text-[13px] text-[var(--landing-muted)] sm:max-w-xs sm:text-right">
                Em vez de site + portal + pastas + calendários + cobranças à parte.
              </p>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {VALUE_STACK.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 rounded-xl border border-[var(--landing-navy)]/6 bg-[var(--landing-surface)]/80 px-3.5 py-3"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--landing-navy)]/8 text-[var(--landing-navy)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--landing-navy)]">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-[var(--landing-muted)]">
                        {item.detail}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-5 text-[12px] leading-relaxed text-[var(--landing-muted)] sm:text-[13px]">
              Honestidade de produto: as calculadoras são simulação de apoio; o SAF-T é consulta —
              o Teglion não substitui a declaração oficial nem a emissão na AT.
            </p>
          </div>
        </FadeInView>

        <FadeInStagger className="mx-auto mt-10 grid max-w-5xl gap-4 sm:mt-12 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <FadeInStaggerItem key={plan.id} className={cn('h-full', plan.order)}>
              <article
                className={cn(
                  'landing-card relative flex h-full flex-col p-5 sm:p-6',
                  plan.featured &&
                    'bg-gradient-to-b from-white to-[var(--landing-ice)]/50 ring-2 ring-[var(--landing-navy)]/25 lg:scale-[1.02]',
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--landing-navy)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:-top-3">
                    Melhor valor
                  </span>
                ) : null}
                <p
                  className={cn(
                    'text-sm font-medium',
                    plan.featured ? 'text-[var(--landing-navy)]' : 'text-[var(--landing-muted)]',
                  )}
                >
                  {plan.name}
                </p>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-3xl font-semibold tracking-tight text-[var(--landing-navy)] sm:text-4xl">
                    {plan.price}
                  </span>
                  <span className="text-base font-medium text-[var(--landing-muted)] sm:text-lg">
                    {plan.period}
                  </span>
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-[var(--landing-muted)] sm:text-sm">
                  {plan.note}
                </p>
                <ul className="mt-4 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-[13px] leading-snug text-[var(--landing-body)] sm:text-[14px]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--landing-gold)]" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={authFirmRegisterUrl()}
                  className={cn(
                    'landing-btn-primary mt-6 w-full text-center',
                    !plan.primary &&
                      '!bg-white !text-[var(--landing-navy)] !shadow-none ring-1 ring-[var(--landing-navy)]/15 hover:!bg-[#F7FAFC]',
                  )}
                >
                  {plan.cta}
                </Link>
              </article>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>

        <p className="mt-6 px-2 text-center text-[13px] leading-relaxed text-[var(--landing-muted)] sm:text-sm">
          O teste de {trialDays} dias é o produto completo — não um «modo limitado». Sem letras
          pequenas. Funciona como app (PWA) no telemóvel. Pagamentos do cliente final ≠ plano SaaS
          do gabinete.
        </p>
      </div>
    </section>
  )
}
