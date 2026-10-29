import { useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  History,
  Info,
  Link2,
  Users,
} from 'lucide-react'

import {
  FIRM_CALCULATORS,
  isFirmCalculatorId,
  type FirmCalculatorId,
} from '@/features/firm/fiscal/calculatorsCatalog'
import { CalculatorClientBar } from '@/features/firm/fiscal/CalculatorClientBar'
import { useCalculatorClient } from '@/features/firm/fiscal/useCalculatorClient'
import { VatCalculatorWorkspace } from '@/features/firm/fiscal/VatCalculatorWorkspace'
import { IrsCalculatorWorkspace } from '@/features/firm/fiscal/IrsCalculatorWorkspace'
import { SsCalculatorWorkspace } from '@/features/firm/fiscal/SsCalculatorWorkspace'
import { WithholdingCalculatorWorkspace } from '@/features/firm/fiscal/WithholdingCalculatorWorkspace'
import { ImtCalculatorWorkspace } from '@/features/firm/fiscal/ImtCalculatorWorkspace'
import { IrcCalculatorWorkspace } from '@/features/firm/fiscal/IrcCalculatorWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { AskMayaButton } from '@/features/maya'
import { Button } from '@/shared/components/ui/button'
import { PageHeader } from '@/shared/design-system'
import { contabilFiscalVatApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

function CalculatorBody({
  id,
  initialClientId,
}: {
  id: FirmCalculatorId
  initialClientId?: string
}) {
  switch (id) {
    case 'iva':
      return <VatCalculatorWorkspace embedded initialClientId={initialClientId} />
    case 'irs':
      return <IrsCalculatorWorkspace embedded initialClientId={initialClientId} />
    case 'ss':
      return <SsCalculatorWorkspace embedded initialClientId={initialClientId} />
    case 'retencao':
      return <WithholdingCalculatorWorkspace embedded initialClientId={initialClientId} />
    case 'imt':
      return <ImtCalculatorWorkspace embedded initialClientId={initialClientId} />
    case 'irc':
      return <IrcCalculatorWorkspace embedded initialClientId={initialClientId} />
    default:
      return null
  }
}

type HistRow = { id?: string; clientId?: string | null; calcType?: string; createdAt?: string }

const CALC_TYPE_TO_ID: Record<string, FirmCalculatorId> = {
  vat_net_gross: 'iva',
  irs_brackets: 'irs',
  ss_contributions: 'ss',
  irs_withholding: 'retencao',
  imt: 'imt',
  irc: 'irc',
}

export function FirmCalculatorsHubPage() {
  const [params, setParams] = useSearchParams()
  const openId = useMemo(() => {
    const raw = params.get('open')
    return isFirmCalculatorId(raw) ? raw : null
  }, [params])
  const urlClientId = params.get('clientId') || undefined
  const { clientId, setClientId, hints, onHints } = useCalculatorClient(urlClientId)

  const active = FIRM_CALCULATORS.find((c) => c.id === openId) ?? null

  const historyQuery = useQuery({
    queryKey: ['fiscal-hub-history'],
    queryFn: () => contabilFiscalVatApi.list({ limit: 80 }),
    staleTime: 30_000,
  })

  const historyItems = (historyQuery.data?.items || []) as HistRow[]

  const filteredHistory = useMemo(() => {
    if (!clientId) return historyItems
    return historyItems.filter((r) => String(r.clientId || '') === clientId)
  }, [historyItems, clientId])

  const kpis = useMemo(() => {
    const withClient = filteredHistory.filter((r) => r.clientId).length
    const byTool = new Set(
      filteredHistory.map((r) => CALC_TYPE_TO_ID[String(r.calcType || '')]).filter(Boolean),
    )
    return [
      {
        id: 'tools',
        label: 'Ferramentas',
        value: FIRM_CALCULATORS.length,
        icon: Calculator,
        tone: 'brand' as const,
      },
      {
        id: 'saved',
        label: clientId ? 'Guardadas (cliente)' : 'Simulações recentes',
        value: filteredHistory.length,
        icon: History,
        tone: 'muted' as const,
      },
      {
        id: 'linked',
        label: 'Com cliente',
        value: withClient,
        icon: Link2,
        tone: 'emerald' as const,
      },
      {
        id: 'coverage',
        label: 'Tipos usados',
        value: `${byTool.size}/${FIRM_CALCULATORS.length}`,
        icon: Users,
        tone: 'amber' as const,
      },
    ]
  }, [filteredHistory, clientId])

  const setOpen = useCallback(
    (id: FirmCalculatorId | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('open', id)
          else next.delete('open')
          next.delete('calc')
          if (clientId) next.set('clientId', clientId)
          else next.delete('clientId')
          return next
        },
        { replace: true },
      )
    },
    [setParams, clientId],
  )

  const onClientChange = useCallback(
    (id: string) => {
      setClientId(id)
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('clientId', id)
          else next.delete('clientId')
          return next
        },
        { replace: true },
      )
    },
    [setClientId, setParams],
  )

  useEffect(() => {
    const raw = params.get('open')
    if (raw && !isFirmCalculatorId(raw)) {
      setOpen(null)
    }
  }, [params, setOpen])

  const recommendedId = hints?.suggestedCalcId

  if (active) {
    const Icon = active.icon
    return (
      <FirmWorkspacePage className="cb-calc-page cb-calc-layout-page">
        <div className="cb-firm-operational-panel cb-calc-layout-panel flex w-full min-w-0 flex-col">
          <div className="cb-calc-tool" data-testid={`firm-calculator-tool-${active.id}`}>
            <div className="cb-calc-tool-chrome">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cb-calc-tool-back -ml-2"
                onClick={() => setOpen(null)}
                data-testid="firm-calculator-back"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
                Todas as calculadoras
              </Button>
              <AskMayaButton intentId="dashboard" />
            </div>

            <PageHeader
              title={active.title}
              subtitle={`${active.description} Simulação de apoio interno — não substitui declaração oficial.`}
              testId={`firm-calculator-header-${active.id}`}
              secondary={
                <span className="cb-calc-tool-badge" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {active.badge}
                </span>
              }
            />

            <div className="cb-calc-tool-purpose" data-testid="firm-calculator-purpose">
              <p className="cb-calc-tool-purpose-title">O que faz esta ferramenta</p>
              <p className="cb-calc-tool-purpose-detail">{active.purpose}</p>
            </div>

            <CalculatorBody id={active.id} initialClientId={clientId || undefined} />
          </div>
        </div>
      </FirmWorkspacePage>
    )
  }

  return (
    <FirmWorkspacePage className="cb-calc-page cb-calc-layout-page">
      <div className="cb-firm-operational-panel cb-calc-layout-panel flex w-full min-w-0 flex-col">
        <div className="cb-calc-hub" data-testid="firm-calculators-hub">
          <PageHeader
            title="Calculadoras"
            subtitle="Simuladores fiscais integrados na carteira: filtre por cliente, puxe o perfil e guarde resultados para conferência do gabinete."
            testId="firm-calculators-hub-header"
            secondary={<AskMayaButton intentId="dashboard" />}
          />

          <div className="cb-calc-kpi-strip" data-testid="firm-calculators-kpis">
            {kpis.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.id} className={cn('cb-calc-kpi', `cb-calc-kpi--${item.tone}`)}>
                  <span className="cb-calc-kpi-icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="cb-calc-kpi-value">{item.value}</p>
                    <p className="cb-calc-kpi-label">{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <CalculatorClientBar
            clientId={clientId}
            onClientIdChange={onClientChange}
            onHints={onHints}
          />

          {hints ? (
            <div className="cb-calc-hub-context" data-testid="firm-calculators-client-context">
              <p className="cb-calc-hub-context-title">Contexto para {hints.displayName}</p>
              <p className="cb-calc-hub-context-detail">
                {hints.taxId ? `NIF ${hints.taxId}` : 'Sem NIF'}
                {hints.vatRegime ? ` · IVA ${hints.vatRegime}` : ''}
                {hints.irsFramework ? ` · ${hints.irsFramework}` : ''}
                {recommendedId
                  ? ` · sugerido: ${FIRM_CALCULATORS.find((c) => c.id === recommendedId)?.title || recommendedId}`
                  : ''}
                . Valores (€) e dependentes continuam a ser introduzidos pelo contabilista.
              </p>
              {recommendedId ? (
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  onClick={() => setOpen(recommendedId)}
                >
                  Abrir {FIRM_CALCULATORS.find((c) => c.id === recommendedId)?.title}
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="cb-calc-hub-banner" role="note">
            <span className="cb-calc-hub-banner-icon" aria-hidden>
              <Info className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="font-medium text-foreground">Apoio ao gabinete, não acto oficial</p>
              <p className="mt-0.5">
                Calcule, associe ao cliente e guarde no histórico. Confirme sempre com a legislação e a
                revisão profissional — estas páginas não emitem nem substituem declarações.
              </p>
            </div>
          </div>

          <ul className="cb-calc-hub-grid">
            {FIRM_CALCULATORS.map((calc) => {
              const Icon = calc.icon
              const recommended = recommendedId === calc.id
              return (
                <li key={calc.id}>
                  <button
                    type="button"
                    className={cn('cb-calc-hub-card', recommended && 'cb-calc-hub-card--active')}
                    data-testid={`firm-calculator-card-${calc.id}`}
                    onClick={() => setOpen(calc.id)}
                  >
                    <span className="cb-calc-hub-card-icon" aria-hidden>
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="cb-calc-hub-card-body">
                      <span className="cb-calc-hub-card-meta">
                        <span className="cb-calc-hub-card-title">{calc.title}</span>
                        <span className="cb-calc-hub-card-badge">
                          {recommended ? 'Sugerida' : calc.badge}
                        </span>
                      </span>
                      <span className="cb-calc-hub-card-desc">{calc.description}</span>
                      <span className="cb-calc-hub-card-purpose">{calc.purpose}</span>
                    </span>
                    <ArrowRight className="cb-calc-hub-card-arrow h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>

        </div>
      </div>
    </FirmWorkspacePage>
  )
}
