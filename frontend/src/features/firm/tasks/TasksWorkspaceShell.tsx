import type { ReactNode } from 'react'

import { TasksKpiStrip } from '@/features/firm/tasks/TasksKpiStrip'
import { TasksOperationsTabBar } from '@/features/firm/tasks/TasksOperationsTabBar'
import type { OverviewKpis, TasksOperationsTab } from '@/features/firm/tasks/tasksOperationsUtils'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'

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

const LEADS: Record<TasksOperationsTab, { title: string; detail: string }> = {
  overview: {
    title: 'O que precisa de atenção',
    detail: 'KPIs e lista prioritária — clique numa linha para abrir obrigação ou tarefa.',
  },
  obligations: {
    title: 'Prazos fiscais por cliente',
    detail: 'IVA, SS, IES e restantes obrigações com estado e prazo. Distinto do Calendário fiscal.',
  },
  month: {
    title: 'Cobertura do mês',
    detail: 'Veja quantos clientes da carteira já cumpriram cada obrigação do período.',
  },
  manual: {
    title: 'Trabalho interno da equipa',
    detail: 'Board ou grelha de follow-ups — não substitui obrigações fiscais.',
  },
  calendar: {
    title: 'Ops no calendário',
    detail: 'Obrigações e tarefas manuais juntas. Agendamentos (consultas) ficam noutro menu.',
  },
  clients: {
    title: 'Carga por empresa',
    detail: 'Quantas obrigações e tarefas abertas tem cada cliente da carteira.',
  },
}

export function TasksWorkspaceShell({
  activeTab,
  headerAction,
  overviewKpis,
  children,
}: {
  activeTab: TasksOperationsTab
  headerAction?: ReactNode
  overviewKpis: OverviewKpis
  children: ReactNode
}) {
  const lead = LEADS[activeTab]

  return (
    <FirmModuleShell
      className="cb-tasks-panel cb-tasks-panel-v2 cb-tasks-page-scroll"
      bodyClassName="cb-tasks-body"
      title={TITLES[activeTab]}
      subtitle={SUBTITLES[activeTab]}
      headerRight={headerAction}
    >
      <div className="cb-tasks-panel-hd shrink-0 px-4 pt-1 sm:px-5">
        <TasksOperationsTabBar active={activeTab} />
      </div>
      <TasksKpiStrip kpis={overviewKpis} />
      <p className="cb-tasks-section-lead" data-testid={`tasks-lead-${activeTab}`}>
        <span className="cb-tasks-section-lead-title">{lead.title}</span>
        {lead.detail}
      </p>
      <div className="cb-tasks-section-host cb-tasks-section-host--flow">{children}</div>
    </FirmModuleShell>
  )
}
