import type { Obligation } from '@/shared/types/contabil'

export function obligationHasRecurrenceSeries(ob: Pick<Obligation, 'recurrenceRuleId' | 'templateId'>) {
  return Boolean(ob.recurrenceRuleId || ob.templateId)
}

export function obligationPeriodYm(ob: Pick<Obligation, 'period'>) {
  return String(ob.period || '').slice(0, 7)
}
