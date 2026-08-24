import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Building2, Kanban, LayoutGrid, Plus, Search } from 'lucide-react'

import type { WorkspaceTask, WorkspaceTaskStatus } from '@/infrastructure/api/contabil/tasks'
import { ClientMultiSelect } from '@/features/firm/components/ClientMultiSelect'
import { ManualTaskOperationsCard } from '@/features/firm/tasks/ManualTaskOperationsCard'
import { TaskKanbanView } from '@/features/firm/tasks/TaskKanbanView'
import { STATUS_LABEL } from '@/features/firm/tasks/taskWorkspaceConstants'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import type { Client } from '@/shared/types/clients'

type ViewMode = 'board' | 'grid'
type RecurrenceFrequency = 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'

export function TasksManualView({
  items,
  loading,
  isFetching,
  openTaskId,
  search,
  statusFilter,
  priorityFilter,
  view,
  showForm,
  form,
  clients,
  teamItems,
  teamNames,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onViewChange,
  onSelectTask,
  onTaskStatusChange,
  onCompleteTask,
  onShowForm,
  onHideForm,
  onFormChange,
  onCreateSubmit,
  createPending,
  embeddedInShell,
}: {
  items: WorkspaceTask[]
  loading: boolean
  isFetching: boolean
  openTaskId: string | null
  search: string
  statusFilter: string
  priorityFilter: string
  view: ViewMode
  showForm: boolean
  form: {
    clientIds: string[]
    title: string
    description: string
    dueDate: string
    priority: string
    assigneeId: string
    recurrenceFrequency: string
  }
  clients: Client[]
  teamItems: { id: string; fullName?: string; email?: string }[]
  teamNames: Map<string, string>
  onSearchChange: (q: string) => void
  onStatusChange: (s: string) => void
  onPriorityChange: (p: string) => void
  onViewChange: (v: ViewMode) => void
  onSelectTask: (t: WorkspaceTask) => void
  onTaskStatusChange: (id: string, status: WorkspaceTaskStatus) => void
  onCompleteTask: (id: string) => void
  onShowForm: () => void
  onHideForm: () => void
  onFormChange: (patch: Partial<typeof form>) => void
  onCreateSubmit: (e: React.FormEvent) => void
  createPending: boolean
  embeddedInShell?: boolean
}) {
  const recurrenceFrequency = (form.recurrenceFrequency || 'NONE') as RecurrenceFrequency
  const hasRecurrence = recurrenceFrequency !== 'NONE'
  const [pickingClient, setPickingClient] = useState(form.clientIds.length > 0)
  const associateClient = pickingClient || form.clientIds.length > 0

  useEffect(() => {
    if (!showForm) setPickingClient(false)
  }, [showForm])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!embeddedInShell ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/15 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-xl border-border/60 bg-background pl-9"
              placeholder="Pesquisar tarefas manuais…"
              value={search}
              onChange={(e: FormChangeEvent) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex rounded-lg border border-border bg-background p-0.5">
            <button
              type="button"
              onClick={() => onViewChange('board')}
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium',
                view === 'board' ? 'bg-muted' : 'text-muted-foreground',
              )}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              className={cn(
                'flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium',
                view === 'grid' ? 'bg-muted' : 'text-muted-foreground',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grelha
            </button>
          </div>
          <select
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">Estado</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs"
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
          >
            <option value="">Prioridade</option>
            <option value="URGENT">Urgente</option>
            <option value="HIGH">Alta</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Baixa</option>
          </select>
          {!embeddedInShell ? (
            <Button type="button" className="h-8 rounded-md" onClick={onShowForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova tarefa
            </Button>
          ) : null}
          {isFetching && !loading ? (
            <span className="text-xs text-muted-foreground">A actualizar…</span>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold tracking-tight">Nova tarefa</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Trabalho da equipa. Não aparece no portal do cliente.
            </p>
          </div>
          <form onSubmit={onCreateSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="task-title" className="text-xs font-medium text-foreground">
                Título
              </label>
              <Input
                id="task-title"
                placeholder="Ex.: Reunir papéis do mês, rever processo interno…"
                value={form.title}
                onChange={(e: FormChangeEvent) => onFormChange({ title: e.target.value })}
                required
                className="rounded-xl"
                autoFocus
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="task-due" className="text-xs font-medium text-foreground">
                  Prazo
                </label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e: FormChangeEvent) => onFormChange({ dueDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="task-priority" className="text-xs font-medium text-foreground">
                  Prioridade
                </label>
                <select
                  id="task-priority"
                  className="h-10 w-full rounded-xl border border-input px-3 text-sm"
                  value={form.priority}
                  onChange={(e) => onFormChange({ priority: e.target.value })}
                >
                  <option value="LOW">Baixa</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="task-assignee" className="text-xs font-medium text-foreground">
                  Responsável
                </label>
                <select
                  id="task-assignee"
                  className="h-10 w-full rounded-xl border border-input px-3 text-sm"
                  value={form.assigneeId}
                  onChange={(e) => onFormChange({ assigneeId: e.target.value })}
                >
                  <option value="">Sem responsável definido</option>
                  {teamItems.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="task-desc" className="text-xs font-medium text-foreground">
                Notas
              </label>
              <Input
                id="task-desc"
                placeholder="Opcional"
                value={form.description}
                onChange={(e: FormChangeEvent) => onFormChange({ description: e.target.value })}
                className="rounded-xl"
              />
            </div>

            {associateClient ? (
              <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">Clientes da carteira</p>
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setPickingClient(false)
                      onFormChange({ clientIds: [], recurrenceFrequency: 'NONE' })
                    }}
                  >
                    Sem cliente
                  </button>
                </div>
                <ClientMultiSelect
                  clients={clients}
                  value={form.clientIds}
                  onChange={(ids) =>
                    onFormChange({ clientIds: ids, ...(ids.length === 1 ? {} : { recurrenceFrequency: 'NONE' }) })
                  }
                  placeholder="Nome, e-mail ou NIF"
                  requireQuery
                />
                {form.clientIds.length === 1 ? (
                  <div className="space-y-1.5">
                    <label htmlFor="task-recurrence" className="text-xs font-medium text-foreground">
                      Recorrência
                    </label>
                    <select
                      id="task-recurrence"
                      className="h-10 w-full rounded-xl border border-input px-3 text-sm"
                      value={form.recurrenceFrequency}
                      onChange={(e) => onFormChange({ recurrenceFrequency: e.target.value })}
                    >
                      <option value="NONE">Uma vez</option>
                      <option value="MONTHLY">Mensal</option>
                      <option value="QUARTERLY">Trimestral</option>
                      <option value="SEMIANNUAL">Semestral</option>
                      <option value="ANNUAL">Anual</option>
                    </select>
                  </div>
                ) : form.clientIds.length > 1 ? (
                  <p className="text-xs text-muted-foreground">
                    Recorrência não está disponível para tarefas com mais de um cliente.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/15 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Building2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Escritório</p>
                    <p className="text-xs text-muted-foreground">Não está ligada a nenhum cliente</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-brand hover:underline"
                  onClick={() => setPickingClient(true)}
                >
                  Ligar a um cliente
                </button>
              </div>
            )}

            {hasRecurrence ? (
              <p className="text-xs text-muted-foreground">
                Recorrente interna — o cliente não é notificado.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={createPending} className="rounded-full">
                {hasRecurrence ? 'Criar tarefa recorrente' : 'Criar tarefa'}
              </Button>
              <Button type="button" variant="ghost" onClick={onHideForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      <div className={cn('min-h-[24rem] flex-1', embeddedInShell ? 'p-0' : 'rounded-2xl border border-border/50 bg-card/30 p-3')}>
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma tarefa manual neste filtro.</p>
            <Button className="rounded-full" onClick={onShowForm}>
              <Plus className="mr-2 h-4 w-4" />
              Criar tarefa
            </Button>
          </div>
        ) : view === 'board' ? (
          <TaskKanbanView
            items={items}
            teamNames={teamNames}
            onSelect={onSelectTask}
            onStatusChange={onTaskStatusChange}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((t) => (
              <ManualTaskOperationsCard
                key={t.id}
                task={t}
                selected={openTaskId === t.id}
                assigneeName={t.assigneeId ? teamNames.get(t.assigneeId) : undefined}
                onSelect={() => onSelectTask(t)}
                onComplete={() => onCompleteTask(t.id)}
                onEdit={() => onSelectTask(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
