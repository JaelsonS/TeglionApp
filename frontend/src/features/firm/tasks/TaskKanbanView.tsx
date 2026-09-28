import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, CheckCircle2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/shared/components/ui/button'
import type { MouseEvent } from 'react'
import { useMemo, useState } from 'react'

import type { WorkspaceTask, WorkspaceTaskStatus } from '@/infrastructure/api/contabil/tasks'
import { assigneeInitials } from '@/features/firm/tasks/tasksWorkspaceUi'
import { formatTaskDueDate, formatTaskTitle } from '@/shared/utils/taskDisplay'
import { cn } from '@/shared/lib/utils'

const KANBAN_COLUMNS: { status: WorkspaceTaskStatus; label: string }[] = [
  { status: 'TODO', label: 'A fazer' },
  { status: 'IN_PROGRESS', label: 'Em curso' },
  { status: 'REVIEW', label: 'Em revisão' },
  { status: 'DONE', label: 'Concluído' },
]

const COLUMN_STATUSES = KANBAN_COLUMNS.map((c) => c.status)

function mapToColumn(status: WorkspaceTaskStatus): WorkspaceTaskStatus {
  if (status === 'DONE' || status === 'ARCHIVED') return 'DONE'
  if (status === 'REVIEW') return 'REVIEW'
  if (status === 'IN_PROGRESS' || status === 'WAITING_CLIENT') return 'IN_PROGRESS'
  return 'TODO'
}

function priorityDot(task: WorkspaceTask) {
  if (task.status === 'DONE' || task.status === 'ARCHIVED') return null
  if (task.isOverdue || task.priority === 'URGENT') return 'cb-tasks-kanban-dot-red'
  if (task.priority === 'HIGH') return 'cb-tasks-kanban-dot-amber'
  return 'cb-tasks-kanban-dot-blue'
}

function TaskCard({
  task,
  teamNames,
  onSelect,
  onQuickEdit,
  onQuickDelete,
  isDragging,
}: {
  task: WorkspaceTask
  teamNames: Map<string, string>
  onSelect: (t: WorkspaceTask) => void
  onQuickEdit?: (t: WorkspaceTask) => void
  onQuickDelete?: (t: WorkspaceTask) => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id, data: { task } })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
  const done = task.status === 'DONE' || task.status === 'ARCHIVED'
  const initials = assigneeInitials(
    task.assigneeId ? teamNames.get(task.assigneeId) : undefined,
  )

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(task)}
      className={cn('cb-tasks-kanban-card w-full', isDragging && 'opacity-50')}
    >
      <div className="flex items-start gap-2">
        {done ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        ) : priorityDot(task) ? (
          <span className={cn('cb-tasks-kanban-dot mt-1', priorityDot(task))} />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className={cn('text-xs font-medium leading-snug', done && 'text-muted-foreground')}>
            {formatTaskTitle(task.title)}
          </p>
          {done ? (
            <p className="mt-0.5 cb-text-caption">Concluída</p>
          ) : task.clientName ? (
            <span className="cb-tasks-client-badge">{task.clientName}</span>
          ) : null}
        </div>
        {onQuickEdit || onQuickDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e: MouseEvent) => e.stopPropagation()}>
              {onQuickEdit ? (
                <DropdownMenuItem onClick={() => onQuickEdit(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              {onQuickDelete ? (
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onQuickDelete(task)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Apagar
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {!done ? (
        <div className="mt-2 flex items-center justify-between">
          {task.dueDate ? (
            <span className="flex items-center gap-1 cb-text-caption">
              <Calendar className="h-3 w-3" />
              {formatTaskDueDate(task.dueDate)}
            </span>
          ) : (
            <span />
          )}
          <span className="cb-tasks-avatar bg-violet-100 text-violet-800">{initials !== '—' ? initials : '?'}</span>
        </div>
      ) : (
        <div className="mt-2 flex justify-end">
          <span className="cb-tasks-avatar bg-sky-100 text-sky-800">{initials !== '—' ? initials : '?'}</span>
        </div>
      )}
    </button>
  )
}

function KanbanColumn({
  label,
  status,
  tasks,
  teamNames,
  onSelect,
  onQuickEdit,
  onQuickDelete,
}: {
  label: string
  status: WorkspaceTaskStatus
  tasks: WorkspaceTask[]
  teamNames: Map<string, string>
  onSelect: (t: WorkspaceTask) => void
  onQuickEdit?: (t: WorkspaceTask) => void
  onQuickDelete?: (t: WorkspaceTask) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={cn('cb-tasks-kanban-col', isOver && 'ring-2 ring-brand/30')}>
      <div className="cb-tasks-kanban-col-hd">
        <span className="text-xs font-semibold text-foreground">
          {label} <span className="font-normal text-muted-foreground">({tasks.length})</span>
        </span>
        <button type="button" className="text-muted-foreground" aria-label="Opções">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="flex max-h-[calc(100vh-16rem)] flex-col gap-0 overflow-y-auto pb-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            teamNames={teamNames}
            onSelect={onSelect}
            onQuickEdit={onQuickEdit}
            onQuickDelete={onQuickDelete}
          />
        ))}
      </div>
    </div>
  )
}

export function TaskKanbanView({
  items,
  teamNames,
  onSelect,
  onStatusChange,
  onQuickEdit,
  onQuickDelete,
}: {
  items: WorkspaceTask[]
  teamNames: Map<string, string>
  onSelect: (t: WorkspaceTask) => void
  onStatusChange: (taskId: string, status: WorkspaceTaskStatus) => void
  onQuickEdit?: (t: WorkspaceTask) => void
  onQuickDelete?: (t: WorkspaceTask) => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const byColumn = useMemo(() => {
    const map = Object.fromEntries(COLUMN_STATUSES.map((s) => [s, [] as WorkspaceTask[]])) as Record<
      WorkspaceTaskStatus,
      WorkspaceTask[]
    >
    for (const t of items) {
      const col = mapToColumn(t.status)
      map[col].push(t)
    }
    return map
  }, [items])

  const activeTask = activeId ? items.find((t) => t.id === activeId) : null

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const taskId = String(e.active.id)
    const overId = e.over?.id
    if (!overId || !COLUMN_STATUSES.includes(overId as WorkspaceTaskStatus)) return
    const task = items.find((t) => t.id === taskId)
    if (task && mapToColumn(task.status) !== overId) onStatusChange(taskId, overId as WorkspaceTaskStatus)
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="cb-tasks-kanban-wrap flex gap-3">
        {KANBAN_COLUMNS.map(({ status, label }) => (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            tasks={byColumn[status]}
            teamNames={teamNames}
            onSelect={onSelect}
            onQuickEdit={onQuickEdit}
            onQuickDelete={onQuickDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} teamNames={teamNames} onSelect={() => {}} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
