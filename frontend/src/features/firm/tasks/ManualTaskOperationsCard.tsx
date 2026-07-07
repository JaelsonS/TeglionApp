import { Calendar, Check, MoreHorizontal, Pencil } from 'lucide-react'

import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/firm/tasks/taskWorkspaceConstants'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { formatTaskDueDate, formatTaskTitle } from '@/shared/utils/taskDisplay'
import { cn } from '@/shared/lib/utils'

const STATUS_PILL: Record<string, string> = {
  BACKLOG: 'bg-slate-100 text-slate-600',
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-sky-50 text-sky-800',
  WAITING_CLIENT: 'bg-amber-50 text-amber-900',
  REVIEW: 'bg-violet-50 text-violet-800',
  DONE: 'bg-emerald-50 text-emerald-800',
  ARCHIVED: 'bg-muted text-muted-foreground',
}

const PRIORITY_PILL: Record<string, string> = {
  LOW: 'text-muted-foreground',
  NORMAL: 'text-foreground',
  HIGH: 'text-amber-800',
  URGENT: 'text-rose-700',
}

export function ManualTaskOperationsCard({
  task,
  selected,
  assigneeName,
  onSelect,
  onComplete,
  onEdit,
}: {
  task: WorkspaceTask
  selected?: boolean
  assigneeName?: string
  onSelect: () => void
  onComplete?: () => void
  onEdit?: () => void
}) {
  const done = task.status === 'DONE' || task.status === 'ARCHIVED'

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all',
        'hover:border-border/80 hover:shadow-md',
        selected && 'ring-2 ring-brand/25',
        task.isOverdue && !done && 'border-rose-200/70',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onSelect}
        >
          <p className={cn('text-sm font-semibold leading-snug text-foreground', done && 'line-through opacity-60')}>
            {formatTaskTitle(task.title)}
          </p>
          {task.clientName ? (
            <p className="mt-1 text-xs text-muted-foreground">{task.clientName}</p>
          ) : null}
          {task.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/90">{task.description}</p>
          ) : null}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg opacity-70">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            {!done && onComplete ? (
              <DropdownMenuItem onClick={onComplete}>
                <Check className="mr-2 h-4 w-4" />
                Marcar concluída
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onClick={onEdit || onSelect}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar / detalhe
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2 py-0.5 text-caption font-semibold uppercase', STATUS_PILL[task.status])}>
          {STATUS_LABEL[task.status]}
        </span>
        <span className={cn('text-caption font-semibold uppercase', PRIORITY_PILL[task.priority])}>
          {PRIORITY_LABEL[task.priority] || task.priority}
        </span>
        {task.dueDate ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-caption font-medium',
              task.isOverdue && !done ? 'text-rose-600' : 'text-muted-foreground',
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatTaskDueDate(task.dueDate)}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border/50 pt-2 cb-text-caption">
        <span>{task.createdAt ? new Date(task.createdAt).toLocaleDateString('pt-PT') : '—'}</span>
        {assigneeName ? <span className="truncate max-w-[8rem]">{assigneeName}</span> : null}
      </div>
    </article>
  )
}
