import type { TasksOperationsTab } from '@/features/firm/tasks/tasksOperationsUtils'

export const FIRM_TASKS_BASE = '/app/firm/tasks' as const

const TAB_PATHS: Record<TasksOperationsTab, string> = {
  overview: `${FIRM_TASKS_BASE}/overview`,
  obligations: `${FIRM_TASKS_BASE}/obligations`,
  manual: `${FIRM_TASKS_BASE}/manual`,
  calendar: `${FIRM_TASKS_BASE}/calendar`,
  clients: `${FIRM_TASKS_BASE}/clients`,
}

export function firmTasksPath(tab: TasksOperationsTab) {
  return TAB_PATHS[tab]
}

export function parseTasksTabFromPathname(pathname: string): TasksOperationsTab {
  const segment = pathname.replace(/^\/app\/firm\/tasks\/?/, '').split('/')[0]
  if (
    segment === 'overview' ||
    segment === 'obligations' ||
    segment === 'manual' ||
    segment === 'calendar' ||
    segment === 'clients'
  ) {
    return segment
  }
  return 'overview'
}
