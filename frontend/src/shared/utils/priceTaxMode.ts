/** Frases de IVA na ficha/página pública (só texto — sem cálculo Stripe). */
export type PriceTaxMode = 'included' | 'excluded'

export const PRICE_TAX_MODE_LABELS: Record<PriceTaxMode, string> = {
  included: 'IVA incluído à taxa legal em vigor',
  excluded: 'Acresce o IVA à taxa legal em vigor',
}

export function priceTaxModeCaption(mode?: PriceTaxMode | null): string | null {
  if (mode === 'included' || mode === 'excluded') return PRICE_TAX_MODE_LABELS[mode]
  return null
}
