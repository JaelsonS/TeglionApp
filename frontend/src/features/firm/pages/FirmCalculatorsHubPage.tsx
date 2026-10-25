import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calculator, Info } from 'lucide-react'

import {
  FIRM_CALCULATORS,
  isFirmCalculatorId,
  type FirmCalculatorId,
} from '@/features/firm/fiscal/calculatorsCatalog'
import { VatCalculatorWorkspace } from '@/features/firm/fiscal/VatCalculatorWorkspace'
import { IrsCalculatorWorkspace } from '@/features/firm/fiscal/IrsCalculatorWorkspace'
import { SsCalculatorWorkspace } from '@/features/firm/fiscal/SsCalculatorWorkspace'
import { WithholdingCalculatorWorkspace } from '@/features/firm/fiscal/WithholdingCalculatorWorkspace'
import { ImtCalculatorWorkspace } from '@/features/firm/fiscal/ImtCalculatorWorkspace'
import { IrcCalculatorWorkspace } from '@/features/firm/fiscal/IrcCalculatorWorkspace'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { AskMayaButton } from '@/features/maya'
import { Button } from '@/shared/components/ui/button'
import { PageHeader } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'

function CalculatorBody({ id }: { id: FirmCalculatorId }) {
  switch (id) {
    case 'iva':
      return <VatCalculatorWorkspace embedded />
    case 'irs':
      return <IrsCalculatorWorkspace embedded />
    case 'ss':
      return <SsCalculatorWorkspace embedded />
    case 'retencao':
      return <WithholdingCalculatorWorkspace embedded />
    case 'imt':
      return <ImtCalculatorWorkspace embedded />
    case 'irc':
      return <IrcCalculatorWorkspace embedded />
    default:
      return null
  }
}

export function FirmCalculatorsHubPage() {
  const [params, setParams] = useSearchParams()
  const openId = useMemo(() => {
    const raw = params.get('open')
    return isFirmCalculatorId(raw) ? raw : null
  }, [params])

  const active = FIRM_CALCULATORS.find((c) => c.id === openId) ?? null

  const setOpen = useCallback(
    (id: FirmCalculatorId | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('open', id)
          else next.delete('open')
          next.delete('calc')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  useEffect(() => {
    const raw = params.get('open')
    if (raw && !isFirmCalculatorId(raw)) {
      setOpen(null)
    }
  }, [params, setOpen])

  if (active) {
    const Icon = active.icon
    return (
      <FirmScrollPage>
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

          <CalculatorBody id={active.id} />
        </div>
      </FirmScrollPage>
    )
  }

  return (
    <FirmScrollPage>
      <div className="cb-calc-hub" data-testid="firm-calculators-hub">
        <PageHeader
          title="Calculadoras"
          subtitle="Uma entrada no menu, seis simuladores de apoio (IVA, IRS, SS, retenção, IMT, IRC). Não substituem a declaração oficial."
          testId="firm-calculators-hub-header"
          secondary={<AskMayaButton intentId="dashboard" />}
        />

        <div className="cb-calc-hub-banner" role="note">
          <span className="cb-calc-hub-banner-icon" aria-hidden>
            <Info className="h-4 w-4" strokeWidth={2} />
          </span>
          <div>
            <p className="font-medium text-foreground">Simulação de apoio ao gabinete</p>
            <p className="mt-0.5">
              Escolha a ferramenta, calcule, guarde no histórico e reabra quando precisar. Confirme sempre
              com a legislação e a revisão profissional — estas páginas não emitem nem substituem actos
              oficiais.
            </p>
          </div>
        </div>

        <ul className="cb-calc-hub-grid">
          {FIRM_CALCULATORS.map((calc) => {
            const Icon = calc.icon
            return (
              <li key={calc.id}>
                <button
                  type="button"
                  className={cn('cb-calc-hub-card')}
                  data-testid={`firm-calculator-card-${calc.id}`}
                  onClick={() => setOpen(calc.id)}
                >
                  <span className="cb-calc-hub-card-icon" aria-hidden>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="cb-calc-hub-card-body">
                    <span className="cb-calc-hub-card-meta">
                      <span className="cb-calc-hub-card-title">{calc.title}</span>
                      <span className="cb-calc-hub-card-badge">{calc.badge}</span>
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

        <p className="cb-calc-hub-footer">
          <Calculator className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom opacity-70" aria-hidden />
          Deep-links legacy (/calculators/iva, …) abrem a mesma ferramenta via ?open=.
        </p>
      </div>
    </FirmScrollPage>
  )
}
