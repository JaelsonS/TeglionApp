import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Building2,
  Car,
  Croissant,
  Scale,
  Stethoscope,
  Store,
  UtensilsCrossed,
} from 'lucide-react'

import type { Client } from '@/shared/types/clients'

import { type CompanyTypeLabel, resolveCompanyType } from '@/features/firm/clients/companyType'

export type { CompanyTypeLabel }
export { resolveCompanyType }

const TYPE_PILL: Record<CompanyTypeLabel, string> = {
  Lda: 'cb-clients-type-lda',
  SA: 'cb-clients-type-sa',
  ENI: 'cb-clients-type-eni',
  Outro: 'cb-clients-type-outro',
}

const PALETTE: Array<{ bg: string; fg: string; Icon: LucideIcon }> = [
  { bg: 'bg-sky-100', fg: 'text-sky-700', Icon: Store },
  { bg: 'bg-amber-100', fg: 'text-amber-800', Icon: Croissant },
  { bg: 'bg-violet-100', fg: 'text-violet-700', Icon: Scale },
  { bg: 'bg-orange-100', fg: 'text-orange-800', Icon: Car },
  { bg: 'bg-emerald-100', fg: 'text-emerald-800', Icon: Stethoscope },
  { bg: 'bg-rose-100', fg: 'text-rose-700', Icon: UtensilsCrossed },
  { bg: 'bg-slate-200', fg: 'text-slate-700', Icon: Building2 },
  { bg: 'bg-cyan-100', fg: 'text-cyan-800', Icon: Briefcase },
]

function hashId(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h + id.charCodeAt(i) * 31) % 997
  return h
}

function iconFromName(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (/padaria|pão|bakery|croissant/.test(n)) return Croissant
  if (/restaurante|petisco|food|cozinha/.test(n)) return UtensilsCrossed
  if (/farmácia|clínica|saúde|medic/.test(n)) return Stethoscope
  if (/advogado|jurídico|legal|sociedade/.test(n)) return Scale
  if (/auto|peças|motor|garagem/.test(n)) return Car
  if (/consult|tech|software|digital/.test(n)) return Briefcase
  if (/loja|comércio|retail|store/.test(n)) return Store
  return Building2
}

export function companyTypePillClass(type: CompanyTypeLabel) {
  return TYPE_PILL[type] ?? TYPE_PILL.Lda
}

export function CompanyAvatar({ client, className }: { client: Client; className?: string }) {
  const name = client.fullName || client.name || 'E'
  const idx = hashId(client._id) % PALETTE.length
  const palette = PALETTE[idx]
  const Icon = iconFromName(name)

  return (
    <span
      className={`cb-clients-avatar ${palette.bg} ${palette.fg} ${className || ''}`}
      aria-hidden
    >
      <Icon className="h-4 w-4" strokeWidth={2.2} />
    </span>
  )
}

import { formatNif } from '@/shared/utils/formatNif'

export function formatNifDisplay(nif?: string | null) {
  return formatNif(nif)
}

export function lastActivityLabel(client: Client) {
  const at = client.lastLoginAt
  if (!at) return '—'
  const then = new Date(at)
  const now = new Date()
  const diffMs = now.getTime() - then.getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 7) return `Há ${days} dias`
  if (days < 30) return `Há ${Math.floor(days / 7)} sem.`
  return then.toLocaleDateString('pt-PT')
}

export function pendingObligationDot(count: number) {
  if (count <= 0) return { className: 'bg-emerald-500', label: '0' }
  if (count === 1) return { className: 'bg-amber-500', label: '1' }
  return { className: 'bg-red-500', label: String(count) }
}
