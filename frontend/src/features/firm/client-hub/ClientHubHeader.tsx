import { Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Pencil } from 'lucide-react'

import { CompanyAvatar, formatNifDisplay } from '@/features/firm/clients/clientCompanyAvatar'
import { FirmClientInviteButton } from '@/features/firm/components/FirmClientInviteButton'
import { operationalStatusLabel } from '@/features/firm/client-hub/clientHubUtils'
import { Button } from '@/shared/components/ui/button'
import type { ClientHubResponse } from '@/infrastructure/api/contabil/types'
import type { Client } from '@/shared/types/clients'
import { cn } from '@/shared/lib/utils'

type Props = {
  hub: ClientHubResponse
  displayName: string
  clientId: string
  onBack: () => void
  onEdit?: () => void
}

export function ClientHubHeader({ hub, displayName, clientId, onBack, onEdit }: Props) {
  const { client, summary, counts } = hub
  const clientForAvatar = { ...client, _id: client._id || client.id || clientId, name: displayName } as Client

  return (
    <header className="cb-client-hub-header">
      <div className="cb-client-hub-back-row">
        <button type="button" onClick={onBack} className="cb-client-hub-back">
          <ArrowLeft className="h-3.5 w-3.5" />
          Empresas
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
              {client.email ? ` · ${client.email}` : ''}
              {client.phone ? ` · ${client.phone}` : ''}
            </p>
            {hub.client.fiscalProfile?.legalForm ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{hub.client.fiscalProfile.legalForm}</p>
            ) : null}
          </div>
        </div>

        <div className="cb-client-hub-actions">
          <FirmClientInviteButton clientId={clientId} email={client.email || undefined} />
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
        />
        <HubKpi
          label="Documentos"
          value={counts.documentsPending}
          sub="por validar"
          alert={counts.documentsPending > 0}
        />
        <HubKpi label="Tarefas abertas" value={counts.tasksOpen} sub="em curso" />
        <HubKpi
          label="Mensagens"
          value={counts.unreadMessagesFromClient}
          sub="não lidas"
          alert={counts.unreadMessagesFromClient > 0}
          alertClass="text-sky-600"
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
}: {
  label: string
  value: number
  sub: string
  alert?: boolean
  alertClass?: string
}) {
  return (
    <div className="cb-client-hub-kpi">
      <p className="cb-client-hub-kpi-label">{label}</p>
      <p className={cn('cb-client-hub-kpi-val', alert && alertClass)}>{value}</p>
      <p className="cb-client-hub-kpi-sub">{sub}</p>
    </div>
  )
}
