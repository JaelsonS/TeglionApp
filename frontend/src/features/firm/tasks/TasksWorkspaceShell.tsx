import type { ReactNode } from 'react'

import { TasksOperationsTabBar } from '@/features/firm/tasks/TasksOperationsTabBar'
import type { TasksOperationsTab } from '@/features/firm/tasks/tasksOperationsUtils'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { cn } from '@/shared/lib/utils'

const SUBTITLES: Record<TasksOperationsTab, string> = {
  overview: 'O que a equipa tem em mãos — prioridades e estado num só sítio.',
  obligations: 'Obrigações por cliente (prazos AT). Distinto do calendário fiscal genérico do gabinete.',
  month: 'Progresso do mês fiscal — quantos clientes já foram tratados em cada prazo.',
  manual: 'Tarefas internas criadas pela equipa (não são obrigações fiscais).',
  calendar: 'Vista mensal: obrigações e tarefas no mesmo calendário operacional.',
  clients: 'Carga de trabalho agregada por empresa da carteira.',
}

const TITLES: Record<TasksOperationsTab, string> = {
  overview: 'Tarefas',
  obligations: 'Obrigações por cliente',
  month: 'Mês fiscal',
  manual: 'Tarefas manuais',
  calendar: 'Calendário de tarefas',
  clients: 'Tarefas por cliente',
}

export function TasksWorkspaceShell({
  activeTab,
  headerAction,
  children,
}: {
  activeTab: TasksOperationsTab
  headerAction?: ReactNode
  children: ReactNode
}) {
  return (
    <FirmModuleShell
      className="cb-tasks-panel"
      bodyClassName={cn('cb-tasks-body flex min-h-0 flex-1 flex-col', activeTab === 'obligations' && 'overflow-hidden')}
      title={TITLES[activeTab]}
      subtitle={SUBTITLES[activeTab]}
      headerRight={headerAction}
    >
      <div className="cb-tasks-panel-hd shrink-0 px-4 sm:px-5">
        <TasksOperationsTabBar active={activeTab} />
      </div>
      {children}
    </FirmModuleShell>
  )
}
