import { Link } from 'react-router-dom'
import { ArrowRight, Calculator } from 'lucide-react'

import { FIRM_CALCULATORS } from '@/features/firm/fiscal/calculatorsCatalog'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/design-system'

export function FirmCalculatorsHubPage() {
  return (
    <FirmScrollPage>
      <div className="cb-calc-hub" data-testid="firm-calculators-hub">
        <PageHeader
          title="Calculadoras"
          subtitle="Escolha a ferramenta — são simulações para conferência interna, não declarações oficiais."
          testId="firm-calculators-hub-header"
          secondary={<AskMayaButton intentId="dashboard" />}
        />

        <p className="cb-calc-hub-disclaimer" role="note">
          Resultados para apoio ao trabalho do escritório. Confirme sempre com a legislação e a sua
          revisão profissional antes de qualquer decisão fiscal.
        </p>

        <ul className="cb-calc-hub-grid">
          {FIRM_CALCULATORS.map((calc) => (
            <li key={calc.id}>
              <Link to={calc.to} className="cb-calc-hub-card" data-testid={`firm-calculator-card-${calc.id}`}>
                <span className="cb-calc-hub-card-icon" aria-hidden>
                  <Calculator className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="cb-calc-hub-card-body">
                  <span className="cb-calc-hub-card-title">{calc.title}</span>
                  <span className="cb-calc-hub-card-desc">{calc.description}</span>
                </span>
                <ArrowRight className="cb-calc-hub-card-arrow h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </FirmScrollPage>
  )
}
