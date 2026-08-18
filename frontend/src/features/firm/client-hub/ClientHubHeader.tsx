import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { CompanyAvatar, formatNifDisplay } from '@/features/firm/clients/clientCompanyAvatar'
import { FirmClientInviteButton } from '@/features/firm/components/FirmClientInviteButton'
import { FirmClientAccessManager } from '@/features/firm/components/FirmClientAccessManager'
import { operationalStatusLabel } from '@/features/firm/client-hub/clientHubUtils'
import { FirmEntityTagsEditor } from '@/features/firm/tags/FirmEntityTagsEditor'
import { AskMayaButton } from '@/features/maya'
import { Button } from '@/shared/components/ui/button'
import type { ClientHubResponse } from '@/infrastructure/api/contabil/types'
import type { Client } from '@/shared/types/clients'
import { usePatchClient } from '@/shared/hooks/queries/useClientHub'
import { getErrorMessage } from '@/shared/utils/errors'
import type { ClientHubSection } from '@/features/firm/client-hub/sections'
import { cn } from '@/shared/lib/utils'

type Props = {
  hub: ClientHubResponse
  displayName: string
  clientId: string
  onBack: () => void
  onEdit?: () => void
  onAccessChanged?: () => void
  onOpenSection?: (section: ClientHubSection) => void
}

export function ClientHubHeader({
  hub,
  displayName,
  clientId,
  onBack,
  onEdit,
  onAccessChanged,
  onOpenSection,
}: Props) {
  const { client, summary, counts } = hub
  const clientForAvatar = { ...client, _id: client._id || client.id || clientId, name: displayName } as Client
  const patch = usePatchClient(clientId)
  const [savingTags, setSavingTags] = useState(false)
  const tags = client.tags || []

  const toggleTag = async (tagId: string) => {
    const current = new Set(tags.map((t) => t.id))
    if (current.has(tagId)) current.delete(tagId)
    else current.add(tagId)
    setSavingTags(true)
    try {
      await patch.mutateAsync({ tagIds: [...current] })
    } catch (err) {
      toast.error('Erro ao actualizar etiquetas', { description: getErrorMessage(err) })
    } finally {
      setSavingTags(false)
    }
  }

  return (
    <header className="cb-client-hub-header">
      <div className="cb-client-hub-back-row">
        <button type="button" onClick={onBack} className="cb-client-hub-back">
          <ArrowLeft className="h-3.5 w-3.5" />
          Clientes
        </button>
      </div>

      <div className="cb-client-hub-hero">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <CompanyAvatar client={clientForAvatar} className="!h-14 !w-14 !rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="cb-client-hub-title">{displayName}</h1>
              <span className={cn('cb-pill', statusPillClass(summary.operationalStatus))}>
                {operationalStatusLabel(summary.operationalStatus)}
              </span>
            </div>
            <p className="cb-client-hub-meta">
              {client.taxId ? `NIF ${formatNifDisplay(client.taxId)}` : 'NIF —'}
              {client.email ? (
                ` · ${client.email}`
              ) : (
                <span className="text-amber-700"> · sem e-mail no cadastro</span>
              )}
              {client.phone ? ` · ${client.phone}` : ''}
            </p>
            {hub.client.fiscalProfile?.legalForm ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{hub.client.fiscalProfile.legalForm}</p>
            ) : null}
            <div className="mt-2">
              <FirmEntityTagsEditor selectedTags={tags} disabled={savingTags} onToggle={(id) => void toggleTag(id)} />
            </div>
          </div>
        </div>

        <div className="cb-client-hub-actions">
          <AskMayaButton className="h-8" />
          {client.portalAccessStatus === 'ACTIVE' || client.portalAccessStatus === 'REVOKED' ? (
            <FirmClientAccessManager
              clientId={clientId}
              email={client.email}
              portalAccessStatus={client.portalAccessStatus}
              onChanged={onAccessChanged}
              onEditClient={onEdit}
            />
          ) : (
            <FirmClientInviteButton
              clientId={clientId}
              email={client.email || undefined}
              onEditClient={onEdit}
            />
          )}
          <Button asChild variant="outline" size="sm" className="h-8 rounded-md text-xs">
            <Link to={`/app/firm/messages?client=${clientId}`}>
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Mensagens
            </Link>
          </Button>
          <Button type="button" size="sm" className="h-8 rounded-md text-xs" onClick={onEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      </div>

      <div className="cb-client-hub-kpis">
        <HubKpi
          label="Obrigações"
          value={counts.obligationsOpen}
          sub="pendentes"
          alert={counts.obligationsOpen > 0}
          onClick={() => onOpenSection?.('obligations')}
        />
        <HubKpi
          label="Documentos"
          value={counts.documentsPending}
          sub="por validar"
          alert={counts.documentsPending > 0}
          onClick={() => onOpenSection?.('documents')}
        />
        <HubKpi
          label="Tarefas abertas"
          value={counts.tasksOpen}
          sub="em curso"
          onClick={() => onOpenSection?.('tasks')}
        />
        <HubKpi
          label="Mensagens"
          value={counts.unreadMessagesFromClient}
          sub="não lidas"
          alert={counts.unreadMessagesFromClient > 0}
          alertClass="text-sky-600"
          onClick={() => onOpenSection?.('messages')}
        />
      </div>
    </header>
  )
}

function statusPillClass(status: string) {
  const key = String(status || 'ok').toLowerCase()
  if (key === 'critico' || key === 'critical') return 'cb-pill-red'
  if (key === 'atencao' || key === 'attention') return 'cb-pill-orange'
  return 'cb-pill-green'
}

function HubKpi({
  label,
  value,
  sub,
  alert,
  alertClass = 'text-orange-600',
  onClick,
}: {
  label: string
  value: number
  sub: string
  alert?: boolean
  alertClass?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="cb-client-hub-kpi"
      onClick={onClick}
      aria-label={`Abrir ${label.toLowerCase()} deste cliente (${value} ${sub})`}
    >
      <p className="cb-client-hub-kpi-label">{label}</p>
      <p className={cn('cb-client-hub-kpi-val', alert && alertClass)}>{value}</p>
      <p className="cb-client-hub-kpi-sub">{sub}</p>
    </button>
  )
}
