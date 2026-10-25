import { BarChart3, Calendar, CheckCircle2, Clock } from 'lucide-react'

import type { OverviewKpis } from '@/features/firm/tasks/tasksOperationsUtils'
import { cn } from '@/shared/lib/utils'

export function TasksKpiStrip({ kpis }: { kpis: OverviewKpis }) {
  return (
    <div className="cb-tasks-kpi-row" data-testid="tasks-kpi-strip">
      <KpiCard label="Em atraso" value={kpis.overdue} tone="red" icon={Clock} />
      <KpiCard label="Para hoje" value={kpis.dueToday} tone="orange" icon={Calendar} />
      <KpiCard label="Esta semana" value={kpis.dueThisWeek} tone="blue" icon={BarChart3} />
      <KpiCard label="Concluídas (mês)" value={kpis.completedMonth} tone="green" icon={CheckCircle2} />
    </div>
  )
}

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: number
  tone: 'red' | 'orange' | 'blue' | 'green'
  icon: typeof Clock
}) {
  const ico =
    tone === 'red'
      ? 'cb-tasks-kpi-ico-red'
      : tone === 'orange'
        ? 'cb-tasks-kpi-ico-orange'
        : tone === 'blue'
          ? 'cb-tasks-kpi-ico-blue'
          : 'cb-tasks-kpi-ico-green'
  const val =
    tone === 'red'
      ? 'cb-tasks-kpi-val-red'
      : tone === 'orange'
        ? 'cb-tasks-kpi-val-orange'
        : tone === 'blue'
          ? 'cb-tasks-kpi-val-blue'
          : 'cb-tasks-kpi-val-green'

  return (
    <div className="cb-tasks-kpi">
      <span className={cn('cb-tasks-kpi-ico', ico)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="cb-tasks-kpi-label">{label}</p>
        <p className={cn('cb-tasks-kpi-val', val)}>{value}</p>
      </div>
    </div>
  )
}
