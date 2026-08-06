import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Circle, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { contabilPublicApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { IntakeChecklistItem } from '@/infrastructure/api/contabil/public'

function ChecklistRow({
  item,
  token,
  onUploaded,
}: {
  item: IntakeChecklistItem
  token: string
  onUploaded: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await contabilPublicApi.uploadIntakeDocument(token, item.tag, file)
      toast.success(`"${item.title}" enviado`)
      onUploaded()
    } catch (err) {
      toast.error('Erro ao enviar ficheiro', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/40 p-3">
      {item.received ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        {item.instructions ? <p className="text-xs text-muted-foreground">{item.instructions}</p> : null}
      </div>
      {item.received ? (
        <span className="shrink-0 text-xs font-semibold text-emerald-700">Recebido</span>
      ) : (
        <>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => void onFileChange(e)} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
            Enviar
          </Button>
        </>
      )}
    </li>
  )
}

export function ServiceIntakePortalPage() {
  const { token } = useParams<{ token: string }>()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['public-intake-checklist', token],
    queryFn: () => contabilPublicApi.getIntakeByToken(token!),
    enabled: Boolean(token),
    retry: false,
  })

  const refetch = () => void queryClient.invalidateQueries({ queryKey: ['public-intake-checklist', token] })

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-center text-sm text-muted-foreground">
          Este link não é válido. Verifique o email que recebeu ou contacte o escritório.
        </p>
      </div>
    )
  }

  const { serviceName, checklist } = query.data
  const allReceived = checklist.length > 0 && checklist.every((c) => c.received)

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-10">
      <header className="mb-6 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {serviceName || 'O seu pedido'}
        </p>
        <h1 className="text-2xl font-bold">Documentos necessários</h1>
      </header>

      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Não há documentos pendentes para este pedido.</p>
        ) : (
          <ul className="space-y-2">
            {checklist.map((item) => (
              <ChecklistRow key={item.tag} item={item} token={token!} onUploaded={refetch} />
            ))}
          </ul>
        )}
        {allReceived ? (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">
            Todos os documentos foram recebidos — a equipa foi notificada.
          </p>
        ) : null}
      </div>
    </div>
  )
}
