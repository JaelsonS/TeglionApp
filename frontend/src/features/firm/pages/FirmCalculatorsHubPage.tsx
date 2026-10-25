import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Calculator, Info } from 'lucide-react'

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
import { FirmWorkspaceFocusDialog } from '@/features/firm/FirmWorkspaceFocusDialog'
import { AskMayaButton } from '@/features/maya'
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

  return (
    <FirmScrollPage>
      <div className="cb-calc-hub" data-testid="firm-calculators-hub">
        <PageHeader
          title="Calculadoras"
          subtitle="Seis simuladores de apoio (IVA, IRS, SS, retenção, IMT, IRC). Não substituem a declaração oficial."
          testId="firm-calculators-hub-header"
          secondary={<AskMayaButton intentId="dashboard" />}
        />

        <div className="cb-calc-hub-banner" role="note">
          <span className="cb-calc-hub-banner-icon" aria-hidden>
            <Info className="h-4 w-4" strokeWidth={2} />
          </span>
          <p>
            Uma entrada no menu, seis ferramentas aqui. Confirme sempre com a legislação e a revisão
            profissional do gabinete.
          </p>
        </div>

        <ul className="cb-calc-hub-grid">
          {FIRM_CALCULATORS.map((calc) => {
            const Icon = calc.icon
            return (
              <li key={calc.id}>
                <button
                  type="button"
                  className={cn('cb-calc-hub-card', openId === calc.id && 'cb-calc-hub-card--active')}
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
                  </span>
                  <ArrowRight className="cb-calc-hub-card-arrow h-4 w-4 shrink-0" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>

        <p className="cb-calc-hub-footer">
          <Calculator className="mr-1.5 inline h-3.5 w-3.5 align-text-bottom opacity-70" aria-hidden />
          No menu do gabinete aparece apenas «Calculadoras».
        </p>
      </div>

      <FirmWorkspaceFocusDialog
        open={Boolean(active)}
        onOpenChange={(open) => !open && setOpen(null)}
        title={active?.title ?? 'Calculadora'}
        description={
          active ? `${active.description} · Simulação de apoio interno.` : undefined
        }
        className="cb-calc-modal w-[min(96vw,72rem)] max-w-[min(96vw,72rem)]"
      >
        {active ? (
          <div className="cb-calc-modal-body px-4 py-4 sm:px-5 sm:py-5">
            <CalculatorBody id={active.id} />
          </div>
        ) : null}
      </FirmWorkspaceFocusDialog>
    </FirmScrollPage>
  )
}
