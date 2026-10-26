/** Helpers partilhados do hub Serviços (catálogo / solicitações / central). */

export function isIrsService(s: {
  name: string
  catalogKey?: string | null
  category?: string
}): boolean {
  if (s.category === 'IRS') return true
  const blob = `${s.name} ${s.catalogKey || ''}`
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob) || /^irs-/.test(s.catalogKey || '')
}

export function formatEurFromCents(cents: number | null | undefined): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}
