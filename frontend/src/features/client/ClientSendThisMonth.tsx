import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, FileUp, ListChecks, Upload } from 'lucide-react'

import { displayDocumentRequestTitle } from '@/features/firm/documents/documentRequestDisplay'
import { normalizeRequestStatus } from '@/features/firm/documents/documentRequestStatus'
import { Button } from '@/shared/components/ui/button'
import type { ClientTask, DocumentRequest, Obligation } from '@/shared/types/contabil'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { cn } from '@/shared/lib/utils'

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function inMonth(iso: string | null | undefined, monthKey: string) {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthKey
}

function isOpenObligation(o: Obligation) {
  if (o.paymentStatus === 'PAID') return false
  if (o.status === 'CANCELLED' || o.status === 'DELIVERED') return false
  return true
}

function isOpenTask(t: ClientTask) {
  const s = String(t.status || '').toUpperCase()
  return !['DONE', 'COMPLETED', 'ARCHIVED', 'CANCELLED'].includes(s)
}

export type SendThisMonthItem = {
  id: string
  kind: 'request' | 'task' | 'obligation'
  title: string
  hint: string
  urgent: boolean
  href: string
}

type Props = {
  requests: DocumentRequest[]
  tasks: ClientTask[]
  obligations: Obligation[]
  className?: string
}

/** Lista clara do que o cliente precisa enviar / tratar este mês. */
export function ClientSendThisMonth({ requests, tasks, obligations, className }: Props) {
  const navigate = useNavigate()
  const monthKey = currentMonthKey()
  const monthLabel = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(new Date())

  const items = useMemo(() => {
    const out: SendThisMonthItem[] = []

    for (const r of requests) {
      const st = normalizeRequestStatus(r.status)
      if (!st || st === 'completed') continue
      const inPeriod =
        (r.periodMonth != null && r.periodMonth === monthKey) ||
        inMonth(r.createdAt, monthKey) ||
        !r.periodMonth
      // Pendentes/vistos: mostrar sempre; answered só no mês
      if (st === 'answered' && !inPeriod) continue
      if (st !== 'pending' && st !== 'seen' && st !== 'answered') continue
      out.push({
        id: `req-${r.id}`,
        kind: 'request',
        title: displayDocumentRequestTitle(r),
        hint:
          st === 'pending'
            ? 'Pedido do escritório — ainda por enviar'
            : st === 'seen'
              ? 'Em revisão — pode completar o envio'
              : 'Aguarda resposta do escritório',
        urgent: st === 'pending',
        href: `/app/client/requests?request=${encodeURIComponent(r.id)}`,
      })
    }

    for (const t of tasks) {
      if (!isOpenTask(t)) continue
      const dueThisMonth = t.dueDate ? inMonth(t.dueDate, monthKey) : true
      const overdue = Boolean(t.isOverdue) || (t.dueDate ? new Date(t.dueDate).getTime() < Date.now() : false)
      if (!dueThisMonth && !overdue) continue
      out.push({
        id: `task-${t._id}`,
        kind: 'task',
        title: t.title,
        hint: t.dueDate
          ? `Tarefa do escritório · prazo ${formatPtDate(t.dueDate, 'date')}`
          : 'Tarefa do escritório',
        urgent: overdue || t.priority === 'URGENT' || t.priority === 'HIGH',
        href: '/app/client/documents',
      })
    }

    for (const o of obligations) {
      if (!isOpenObligation(o)) continue
      if (!inMonth(o.dueDate, monthKey) && !(new Date(o.dueDate).getTime() < Date.now())) continue
      const overdue = new Date(o.dueDate).getTime() < Date.now()
      out.push({
        id: `ob-${o._id || o.id}`,
        kind: 'obligation',
        title: o.title || o.type || 'Obrigação fiscal',
        hint: `Prazo ${formatPtDate(o.dueDate, 'date')} · documentos / pagamento`,
        urgent: overdue,
        href: `/app/client/agenda?obligation=${encodeURIComponent(String(o._id || o.id || ''))}`,
      })
    }

    out.sort((a, b) => Number(b.urgent) - Number(a.urgent))
    return out
  }, [monthKey, obligations, requests, tasks])

  const pendingCount = items.filter((i) => i.urgent || i.kind === 'request').length

  return (
    <section className={cn('cb-card-padded border-brand/15 bg-gradient-to-br from-brand/[0.04] to-card', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="cb-text-label text-brand">O que enviar este mês</p>
          <h3 className="mt-1 font-display text-lg font-semibold capitalize text-foreground">{monthLabel}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos do escritório, tarefas e prazos que precisam da sua acção.
          </p>
        </div>
        {items.length > 0 ? (
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-primary-foreground">
            {items.length} pendente{items.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-emerald-50/80 px-3 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="font-medium">Nada urgente para enviar neste momento.</p>
            <p className="mt-0.5 text-xs text-emerald-800/80">
              Quando o escritório pedir documentos, aparece aqui.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-full border-emerald-200 bg-white"
              onClick={() => navigate('/app/client/documents')}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Enviar documento mesmo assim
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => navigate(item.href)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  item.urgent
                    ? 'border-amber-200/80 bg-amber-50/60 hover:bg-amber-50'
                    : 'border-border/70 bg-card hover:bg-muted/30',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    item.kind === 'request' && 'bg-teal-100 text-teal-700',
                    item.kind === 'task' && 'bg-indigo-100 text-indigo-700',
                    item.kind === 'obligation' && 'bg-sky-100 text-sky-800',
                  )}
                >
                  {item.kind === 'request' ? (
                    <FileUp className="h-4 w-4" aria-hidden />
                  ) : item.kind === 'task' ? (
                    <ListChecks className="h-4 w-4" aria-hidden />
                  ) : (
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                </span>
                <span className="shrink-0 self-center text-xs font-semibold text-brand">Abrir</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pendingCount > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" className="rounded-full" onClick={() => navigate('/app/client/requests')}>
            Ver todos os pedidos
          </Button>
          <Button type="button" variant="outline" className="rounded-full" onClick={() => navigate('/app/client/documents')}>
            Ir a documentos
          </Button>
        </div>
      ) : null}
    </section>
  )
}
