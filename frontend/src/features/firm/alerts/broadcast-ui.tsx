import { Badge } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'
import type { BroadcastPriority } from '@/infrastructure/api/contabil/broadcasts'

const PRIORITY_STYLES: Record<BroadcastPriority, string> = {
  LOW: 'bg-slate-100 text-slate-700 ring-slate-200',
  MEDIUM: 'bg-sky-50 text-sky-800 ring-sky-200',
  HIGH: 'bg-amber-50 text-amber-900 ring-amber-200',
  URGENT: 'bg-red-50 text-red-800 ring-red-200',
}

const PRIORITY_LABELS: Record<BroadcastPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export function PriorityBadge({ priority }: { priority: BroadcastPriority | string }) {
  const p = (priority as BroadcastPriority) || 'MEDIUM'
  return (
    <Badge variant="muted" className={cn('ring-1 normal-case', PRIORITY_STYLES[p] || PRIORITY_STYLES.MEDIUM)}>
      {PRIORITY_LABELS[p] || p}
    </Badge>
  )
}

const CATEGORY_STYLES: Record<string, string> = {
  AVISO: 'bg-sky-50 text-sky-800',
  LEMBRETE: 'bg-violet-50 text-violet-800',
  URGENTE: 'bg-red-50 text-red-800',
  FISCAL: 'bg-indigo-50 text-indigo-800',
  INFORMATIVO: 'bg-slate-100 text-slate-700',
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge variant="muted" className={cn('normal-case', CATEGORY_STYLES[category] || 'bg-muted text-muted-foreground')}>
      {category.replace(/_/g, ' ')}
    </Badge>
  )
}
