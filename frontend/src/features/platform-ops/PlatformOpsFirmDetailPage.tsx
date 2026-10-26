import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useState, type ChangeEvent } from 'react'

import { platformOpsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { getErrorMessage } from '@/shared/utils/errors'

export function PlatformOpsFirmDetailPage() {
  const { firmId = '' } = useParams<{ firmId: string }>()
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState<'suspend' | 'reactivate' | null>(null)
  const [trialOpen, setTrialOpen] = useState(false)
  const [trialDays, setTrialDays] = useState('14')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelName, setCancelName] = useState('')

  const detail = useQuery({
    queryKey: ['platform-ops', 'firm', firmId],
    queryFn: () => platformOpsApi.firmDetail(firmId),
    enabled: Boolean(firmId),
  })

  const suspend = useMutation({
    mutationFn: () => platformOpsApi.suspendFirm(firmId),
    onSuccess: (res) => {
      toast.success(res.already ? 'Já estava suspenso.' : 'Gabinete suspenso.')
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
      setConfirm(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const reactivate = useMutation({
    mutationFn: () => platformOpsApi.reactivateFirm(firmId),
    onSuccess: (res) => {
      toast.success(res.already ? 'Já estava activo.' : 'Gabinete reactivado.')
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
      setConfirm(null)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const extendTrial = useMutation({
    mutationFn: () => platformOpsApi.extendTrial(firmId, { days: Number(trialDays) }),
    onSuccess: (res) => {
      toast.success(
        `Trial até ${res.trialEndsAt ? new Date(res.trialEndsAt).toLocaleString('pt-PT') : '—'}.`,
      )
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
      setTrialOpen(false)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const cancelFirm = useMutation({
    mutationFn: () => platformOpsApi.cancelFirm(firmId, cancelName),
    onSuccess: (res) => {
      toast.success(res.already ? 'Já estava cancelado.' : 'Gabinete cancelado — sessões revogadas.')
      void qc.invalidateQueries({ queryKey: ['platform-ops'] })
      setCancelOpen(false)
      setCancelName('')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  if (detail.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> A carregar…
      </p>
    )
  }

  if (detail.isError || !detail.data) {
    return <p className="text-sm text-destructive">{getErrorMessage(detail.error)}</p>
  }

  const f = detail.data
  const canManage = !f.internalOps && f.status !== 'CANCELLED'
  const cancelReady = cancelName.trim() === String(f.name || '').trim()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/app/ops/firms"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Gabinetes
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">{f.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{f.slug}</p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setTrialOpen(true)}>
              Estender trial
            </Button>
            {f.status === 'SUSPENDED' ? (
              <Button type="button" size="sm" onClick={() => setConfirm('reactivate')}>
                Reactivar
              </Button>
            ) : (
              <Button type="button" size="sm" variant="destructive" onClick={() => setConfirm('suspend')}>
                Suspender
              </Button>
            )}
            <Button type="button" size="sm" variant="destructive" onClick={() => setCancelOpen(true)}>
              Cancelar gabinete
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {f.internalOps ? 'Gabinete anfitrião do Control Center — sem alterar.' : 'Cancelado.'}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Estado', value: f.status || '—' },
          { label: 'Subscrição', value: f.subscriptionStatus || '—' },
          { label: 'Users activos', value: f.counts.activeFirmUsers ?? '—' },
          { label: 'Clientes', value: f.counts.clients ?? '—' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-lg font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Criado:</span>{' '}
          {new Date(f.createdAt).toLocaleString('pt-PT')}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">Trial até:</span>{' '}
          {f.trialEndsAt ? new Date(f.trialEndsAt).toLocaleString('pt-PT') : '—'}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">País / plano:</span> {f.countryCode || '—'} ·{' '}
          {f.billingPlan || '—'}
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">Site público:</span>{' '}
          {f.hasPublicSite ? 'sim' : 'não'}
          {f.internalOps ? ' · ops host' : ''}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Audit recente deste gabinete</h2>
        <ul className="mt-2 space-y-2">
          {(f.recentAudit || []).length === 0 ? (
            <li className="text-sm text-muted-foreground">Sem eventos.</li>
          ) : (
            f.recentAudit.map((item) => (
              <li key={item.id} className="rounded-lg border border-border/50 px-3 py-2 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{item.action}</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString('pt-PT')}
                  </time>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <ConfirmDialog
        open={confirm === 'suspend'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Suspender gabinete"
        description={`Isto bloqueia o acesso diário de «${f.name}». Confirma?`}
        confirmLabel={suspend.isPending ? 'A suspender…' : 'Suspender'}
        variant="destructive"
        onConfirm={() => suspend.mutateAsync()}
      />
      <ConfirmDialog
        open={confirm === 'reactivate'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Reactivar gabinete"
        description={`Repor acesso de «${f.name}» (ACTIVE ou TRIAL conforme datas).`}
        confirmLabel={reactivate.isPending ? 'A reactivar…' : 'Reactivar'}
        onConfirm={() => reactivate.mutateAsync()}
      />

      <Dialog open={trialOpen} onOpenChange={setTrialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estender trial</DialogTitle>
            <DialogDescription>
              Adiciona dias a partir da data de trial actual (ou de hoje). O estado passa a TRIAL se aplicável.
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm">
            <span className="text-muted-foreground">Dias (1–365)</span>
            <Input
              className="mt-1"
              type="number"
              min={1}
              max={365}
              value={trialDays}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTrialDays(e.target.value)}
            />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTrialOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={extendTrial.isPending || !Number(trialDays)}
              onClick={() => extendTrial.mutate()}
            >
              {extendTrial.isPending ? 'A guardar…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open)
          if (!open) setCancelName('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar gabinete</DialogTitle>
            <DialogDescription>
              Não apaga dados fiscais. Define estado CANCELLED, desactiva utilizadores e revoga sessões.
              Escreva exactamente o nome do gabinete para confirmar: <strong>{f.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder={f.name}
            value={cancelName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCancelName(e.target.value)}
            autoComplete="off"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!cancelReady || cancelFirm.isPending}
              onClick={() => cancelFirm.mutate()}
            >
              {cancelFirm.isPending ? 'A cancelar…' : 'Cancelar acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
