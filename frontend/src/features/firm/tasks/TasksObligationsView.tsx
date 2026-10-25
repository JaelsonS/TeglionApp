import { Link } from 'react-router-dom'

import type { useObligationsHub } from '@/features/firm/obligations/useObligationsHub'
import { TasksObligationsTableView } from '@/features/firm/tasks/TasksObligationsTableView'

type Hub = ReturnType<typeof useObligationsHub>

export function TasksObligationsView({ hub }: { hub: Hub }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <p
        className="shrink-0 border-b border-border/40 bg-muted/20 px-4 py-2 text-xs leading-relaxed text-muted-foreground sm:px-5"
        data-testid="obligations-purpose-hint"
      >
        Obrigações <strong className="font-medium text-foreground">por cliente</strong> (IVA, SS, IES…)
        com prazo e estado — distinto do{' '}
        <Link to="/app/firm/fiscal-calendar" className="font-medium text-brand underline-offset-2 hover:underline">
          Calendário fiscal
        </Link>{' '}
        (prazos genéricos do gabinete).
      </p>
      <TasksObligationsTableView hub={hub} />
    </div>
  )
}
