import { NavLink, useSearchParams } from 'react-router-dom'

import { firmTasksPath } from '@/features/firm/tasks/firmTasksPaths'
import type { TasksOperationsTab } from '@/features/firm/tasks/tasksOperationsUtils'
import { cn } from '@/shared/lib/utils'

const TAB_HINTS: Record<TasksOperationsTab, string> = {
  overview: 'Prioridades e KPIs do dia',
  obligations: 'Prazos fiscais por cliente',
  month: 'Cobertura do mês na carteira',
  manual: 'Board de tarefas internas',
  calendar: 'Ops — não é Agenda de consultas',
  clients: 'Carga agregada por empresa',
}

const TABS: { id: TasksOperationsTab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'obligations', label: 'Obrigações fiscais' },
  { id: 'month', label: 'Mês fiscal' },
  { id: 'manual', label: 'Manuais' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'clients', label: 'Por cliente' },
]

export function TasksOperationsTabBar({ active }: { active: TasksOperationsTab }) {
  const [searchParams] = useSearchParams()

  return (
    <nav className="cb-tasks-tabs" aria-label="Secções de tarefas">
      {TABS.map(({ id, label }) => {
        const params = new URLSearchParams(searchParams)
        params.delete('tab')
        params.delete('kind')
        params.delete('section')
        if (active !== id) params.delete('create')
        if (id !== 'manual' && id !== 'clients') params.delete('task')
        if (id !== 'obligations') params.delete('ob')
        const search = params.toString()

        return (
          <NavLink
            key={id}
            to={{ pathname: firmTasksPath(id), search: search ? `?${search}` : '' }}
            data-testid={`firm-tasks-tab-${id}`}
            title={TAB_HINTS[id]}
            className={({ isActive }: { isActive: boolean }) => cn('cb-tasks-tab', isActive && 'cb-tasks-tab-active')}
          >
            {label}
          </NavLink>
        )
      })}
    </nav>
  )
}
