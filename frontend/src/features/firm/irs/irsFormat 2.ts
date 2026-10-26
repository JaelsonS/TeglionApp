import { getServicePublishPresentation } from '@/features/firm/services/servicePublishState'
import type { AccountingService } from '@/shared/types/contabil'

export type IrsPublishFilter = 'all' | 'published' | 'internal' | 'inactive'

export function formatEurFromCents(cents: number | null | undefined): string {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

export function isIrsService(s: { name: string; catalogKey?: string | null; category?: string }): boolean {
  if (s.category === 'IRS') return true
  const blob = `${s.name} ${s.catalogKey || ''}`
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob) || /^irs-/.test(s.catalogKey || '')
}

export function taxYearOf(s: AccountingService): number | null {
  const y = s.intakeForm?.irsConfig?.taxYear
  return typeof y === 'number' && Number.isFinite(y) ? y : null
}

export function yearsLabelFor(services: AccountingService[]): string {
  const years: number[] = []
  for (const s of services) {
    const y = taxYearOf(s)
    if (y != null && !years.includes(y)) years.push(y)
  }
  years.sort((a, b) => a - b)
  if (!years.length) return '—'
  return years.join(' · ')
}

export function publishBadgeClass(id: string): string {
  if (id === 'published') return 'cb-irs-badge cb-irs-badge--published'
  if (id === 'inactive') return 'cb-irs-badge cb-irs-badge--inactive'
  if (id === 'ready') return 'cb-irs-badge cb-irs-badge--ready'
  return 'cb-irs-badge cb-irs-badge--draft'
}

export function matchesIrsQuery(s: AccountingService, q: string): boolean {
  if (!q) return true
  const hay = [s.name, s.catalogKey, s.slug, taxYearOf(s) != null ? String(taxYearOf(s)) : '']
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

export function matchesPublishFilter(s: AccountingService, filter: IrsPublishFilter): boolean {
  if (filter === 'all') return true
  const id = getServicePublishPresentation(s).id
  if (filter === 'published') return id === 'published'
  if (filter === 'inactive') return id === 'inactive'
  return id === 'draft' || id === 'ready'
}

export function summarizeIrsServices(services: AccountingService[]) {
  let active = 0
  let published = 0
  let internal = 0
  let inactive = 0
  for (const s of services) {
    const id = getServicePublishPresentation(s).id
    if (id === 'inactive') inactive += 1
    else active += 1
    if (id === 'published') published += 1
    if (id === 'draft' || id === 'ready') internal += 1
  }
  return { total: services.length, active, published, internal, inactive }
}
