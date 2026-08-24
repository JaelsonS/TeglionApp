import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { ClientMultiSelect } from '@/features/firm/components/ClientMultiSelect'
import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import type { Client } from '@/shared/types/clients'

export type TaskEditValues = {
  title: string
  description: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  dueDate: string
  assigneeId: string
  clientIds: string[]
}

function emptyValues(): TaskEditValues {
  return { title: '', description: '', priority: 'NORMAL', dueDate: '', assigneeId: '', clientIds: [] }
}

function fromTask(task: WorkspaceTask): TaskEditValues {
  return {
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'NORMAL',
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task.assigneeId || '',
    clientIds: task.clientIds?.length ? task.clientIds : (task.clientId ? [task.clientId] : []),
  }
}

/**
 * Edição completa de tarefa manual, em Dialog centralizado -- mesmo padrão de
 * FiscalEventFormDialog.tsx (não painel lateral). Substitui os campos que antes eram
 * texto somente-leitura no TaskDetailPanel (título, descrição, prioridade, prazo,
 * responsável) e adiciona a edição dos clientes relacionados via M2M.
 */
export function TaskEditDialog({
  open,
  onOpenChange,
  task,
  clients,
  teamItems,
  onSubmit,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: WorkspaceTask | null
  clients: Client[]
  teamItems: { id: string; fullName?: string; email?: string }[]
  onSubmit: (values: TaskEditValues) => Promise<void> | void
  saving?: boolean
}) {
  const [values, setValues] = useState<TaskEditValues>(emptyValues())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setValues(task ? fromTask(task) : emptyValues())
  }, [open, task])

  function setField<K extends keyof TaskEditValues>(key: K, value: TaskEditValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!values.title.trim()) {
      setError('Indique um título para a tarefa.')
      return
    }
    setError('')
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-xl flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle>Editar tarefa</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <section className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-edit-title">Título</Label>
                <Input
                  id="task-edit-title"
                  value={values.title}
                  onChange={(e: FormChangeEvent) => setField('title', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-edit-desc">Descrição</Label>
                <Textarea
                  id="task-edit-desc"
                  value={values.description}
                  onChange={(e: FormChangeEvent) => setField('description', e.target.value)}
                  rows={3}
                  placeholder="Notas internas sobre a tarefa…"
                />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="task-edit-due">Prazo</Label>
                <Input
                  id="task-edit-due"
                  type="date"
                  value={values.dueDate}
                  onChange={(e: FormChangeEvent) => setField('dueDate', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-edit-priority">Prioridade</Label>
                <select
                  id="task-edit-priority"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={values.priority}
                  onChange={(e) => setField('priority', e.target.value as TaskEditValues['priority'])}
                >
                  <option value="LOW">Baixa</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="task-edit-assignee">Responsável</Label>
                <select
                  id="task-edit-assignee"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={values.assigneeId}
                  onChange={(e) => setField('assigneeId', e.target.value)}
                >
                  <option value="">Sem responsável definido</option>
                  {teamItems.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="space-y-1.5">
              <Label>Clientes relacionados</Label>
              <ClientMultiSelect clients={clients} value={values.clientIds} onChange={(ids) => setField('clientIds', ids)} />
              {values.clientIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sem cliente — fica como tarefa do escritório.</p>
              ) : null}
            </section>

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-border/60 px-5 py-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'A guardar…' : 'Guardar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function buildTaskEditPatch(values: TaskEditValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    priority: values.priority,
    dueDate: values.dueDate || null,
    assigneeId: values.assigneeId || null,
    clientIds: values.clientIds,
  }
}
