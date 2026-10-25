import type { ReactNode } from 'react'

import { TasksOperationsTabBar } from '@/features/firm/tasks/TasksOperationsTabBar'
import type { TasksOperationsTab } from '@/features/firm/tasks/tasksOperationsUtils'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { cn } from '@/shared/lib/utils'

const SUBTITLES: Record<TasksOperationsTab, string> = {
  overview: 'Prioridades da equipa — o que está em atraso, em curso e concluído num só sítio.',
  obligations: 'Obrigações fiscais por cliente (IVA, SS…). Não confundir com Calendário fiscal.',
  month: 'Progresso do mês fiscal na carteira — quantos clientes já cumpriram cada prazo.',
  manual: 'Tarefas internas da equipa (follow-ups, revisões) — não substituem obrigações fiscais.',
  calendar: 'Calendário operacional: obrigações e tarefas juntas. Distinto de Agendamentos (consultas).',
  clients: 'Resumo de carga por empresa — quantas obrigações e tarefas abertas tem cada cliente.',
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
