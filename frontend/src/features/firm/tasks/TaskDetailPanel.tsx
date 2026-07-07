import { useCallback, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Link } from 'react-router-dom'
import {
  Archive,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  History,
  MessageSquare,
  RotateCcw,
  Scale,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import type { WorkspaceTaskStatus } from '@/infrastructure/api/contabil/tasks'
import { tasksApi } from '@/infrastructure/api/contabil/tasks'
import { PRIORITY_LABEL, STATUS_LABEL } from '@/features/firm/tasks/taskWorkspaceConstants'
import { DocumentPreviewModal } from '@/shared/components/contabil/DocumentPreviewModal'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge, SkeletonCard } from '@/shared/design-system'
import { usePatchTask, useTaskComment, useTaskDetail } from '@/shared/hooks/queries/useTasksWorkspace'
import { fetchDocumentBlobUrl } from '@/infrastructure/api'
import { formatTaskDueDate, formatTaskTitle } from '@/shared/utils/taskDisplay'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { cn } from '@/shared/lib/utils'

type Props = {
  taskId: string | null
  teamNames: Map<string, string>
  onClose: () => void
  onMutate: () => void
  embedded?: boolean
}

export function TaskDetailPanel({ taskId, teamNames, onClose, onMutate, embedded = true }: Props) {
  const { data, isLoading, refetch } = useTaskDetail(taskId)
  const patchTask = usePatchTask()
  const commentMut = useTaskComment()
  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  const task = data?.task
  const timeline = data?.timeline || []
  const documents = data?.documents || []
  const obligation = data?.obligation

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      toast.success(ok)
      onMutate()
      void refetch()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const onStatusChange = (status: WorkspaceTaskStatus) => {
    if (!task) return
    patchTask.mutate(
      { id: task.id, patch: { status } },
      {
        onSuccess: () => {
          toast.success('Estado actualizado')
          onMutate()
          void refetch()
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    )
  }

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!taskId || !files?.length) return
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          await tasksApi.attachFile(taskId, file)
        }
        toast.success(files.length > 1 ? 'Documentos anexados' : 'Documento anexado')
        onMutate()
        void refetch()
      } catch (e) {
        toast.error('Erro no upload', { description: getErrorMessage(e) })
      } finally {
        setUploading(false)
      }
    },
    [taskId, onMutate, refetch],
  )

  const openDocPreview = async (docId: string, title: string) => {
    setPreviewTitle(title)
    setPreviewOpen(true)
    setPreviewUrl(null)
    try {
      const url = await fetchDocumentBlobUrl(docId, 'firm')
      setPreviewUrl(url)
    } catch (e) {
      toast.error('Pré-visualização indisponível', { description: getErrorMessage(e) })
      setPreviewOpen(false)
    }
  }

  if (!taskId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 opacity-30" />
        <p className="max-w-sm text-sm">Selecione uma tarefa para ver detalhe, documentos, timeline e comentários.</p>
      </div>
    )
  }

  const shellClass = embedded
    ? 'cb-firm-detail-embed flex h-full min-h-0 flex-col bg-card'
    : 'fixed inset-y-0 right-0 z-40 flex w-full max-w-lg flex-col border-l bg-card shadow-2xl'

  return (
    <aside className={shellClass}>
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0">
          {isLoading ? (
            <SkeletonCard />
          ) : (
            <>
              <h2 className="truncate text-lg font-semibold">{formatTaskTitle(task?.title)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{task?.clientName || 'Cliente'}</p>
            </>
          )}
        </div>
        <Button type="button" size="icon" variant="ghost" className="shrink-0 rounded-full" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </header>

      {isLoading || !task ? (
        <div className="space-y-3 p-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 border-b border-border/60 p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Estado</span>
                <select
                  className="flex h-9 w-full rounded-lg border border-input px-2 text-sm"
                  value={task.status}
                  onChange={(e) => onStatusChange(e.target.value as WorkspaceTaskStatus)}
                >
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Prioridade</span>
                <p className="mt-1 font-medium">{PRIORITY_LABEL[task.priority] || task.priority}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Prazo</span>
                <p className={cn('mt-1 font-medium', task.isOverdue && 'text-destructive')}>
                  {task.dueDate ? formatTaskDueDate(task.dueDate) : '—'}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Responsável</span>
                <p className="mt-1 font-medium">
                  {task.assigneeId ? teamNames.get(task.assigneeId) || 'Equipa' : '—'}
                </p>
              </div>
            </div>

            {task.description ? (
              <p className="rounded-xl bg-muted/30 px-3 py-2 text-sm text-muted-foreground">{task.description}</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {obligation ? (
                <Button size="sm" variant="outline" className="rounded-full" asChild>
                  <Link to={`/app/firm/tasks/obligations?ob=${obligation.id}`}>
                    <Scale className="mr-1.5 h-4 w-4" />
                    {obligation.title || 'Obrigação'}
                  </Link>
                </Button>
              ) : null}
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to={`/app/firm/clients/${task.clientId}`}>
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  Área do cliente
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to={`/app/firm/documents/requests?client=${task.clientId}`}>
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  Mensagens
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" className="rounded-full" onClick={() => run(() => tasksApi.duplicate(task.id), 'Duplicada')}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Duplicar
              </Button>
              {task.status === 'DONE' || task.status === 'ARCHIVED' ? (
                <Button size="sm" variant="secondary" className="rounded-full" onClick={() => run(() => tasksApi.reopen(task.id), 'Reaberta')}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reabrir
                </Button>
              ) : (
                <Button size="sm" variant="secondary" className="rounded-full" onClick={() => run(() => tasksApi.archive(task.id), 'Arquivada')}>
                  <Archive className="mr-1 h-3.5 w-3.5" /> Arquivar
                </Button>
              )}
              <Button size="sm" variant="ghost" className="rounded-full text-destructive" onClick={() => run(() => tasksApi.remove(task.id), 'Removida')}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Apagar
              </Button>
            </div>
          </div>

          <section className="border-b border-border/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documentos</h3>
            <label
              className={cn(
                'mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand/25 bg-muted/20 p-6 transition hover:border-brand/50',
                uploading && 'opacity-60',
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                void handleFiles(e.dataTransfer.files)
              }}
            >
              <Upload className="h-6 w-6 text-brand" />
              <span className="text-xs font-medium">Arrastar ficheiros ou clicar para anexar</span>
              <input
                type="file"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => void handleFiles(e.target.files)}
              />
            </label>
            <ul className="mt-3 space-y-2">
              {documents.length === 0 ? (
                <li className="text-xs text-muted-foreground">Sem anexos nesta tarefa.</li>
              ) : (
                documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title || 'Documento'}</p>
                      <p className="cb-text-caption">
                        {d.category || 'Ficheiro'} · {d.uploadedByRole === 'CLIENT' ? 'Cliente' : 'Escritório'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => void openDocPreview(d.id, d.title || 'Documento')}>
                        <FileUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-8 w-8" asChild>
                        <a href={`/app/firm/documents/files?doc=${d.id}`}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="border-b border-border/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Histórico
            </h3>
            <ul className="mt-3 space-y-3">
              {timeline.length === 0 ? (
                <li className="text-xs text-muted-foreground">Sem eventos.</li>
              ) : (
                timeline.slice(0, 20).map((ev) => (
                  <li key={ev.id} className="border-l-2 border-brand/20 pl-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{ev.title}</p>
                      {ev.kind === 'comment' ? <Badge variant="muted">Comentário</Badge> : null}
                    </div>
                    {ev.description ? <p className="text-xs text-muted-foreground">{ev.description}</p> : null}
                    <p className="mt-0.5 cb-text-caption">
                      {ev.actorName || ev.actorRole} · {ev.createdAt ? formatPtDate(ev.createdAt, 'long') : ''}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="p-4">
            <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" /> Comentários
            </h3>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (!comment.trim() || !taskId) return
                commentMut.mutate(
                  { id: taskId, body: comment.trim() },
                  { onSuccess: () => { setComment(''); void refetch() } },
                )
              }}
            >
              <Input value={comment} onChange={(e: FormChangeEvent) => setComment(e.target.value)} placeholder="Comentário interno ou para o cliente…" className="rounded-full" />
              <Button type="submit" size="sm" disabled={commentMut.isPending}>
                Enviar
              </Button>
            </form>
          </section>
        </div>
      )}

      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
          setPreviewOpen(false)
        }}
        title={previewTitle}
        previewUrl={previewUrl}
      />
    </aside>
  )
}
