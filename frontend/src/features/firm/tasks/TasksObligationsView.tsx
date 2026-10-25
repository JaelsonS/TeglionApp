import type { useObligationsHub } from '@/features/firm/obligations/useObligationsHub'
import { TasksObligationsTableView } from '@/features/firm/tasks/TasksObligationsTableView'

type Hub = ReturnType<typeof useObligationsHub>

export function TasksObligationsView({ hub }: { hub: Hub }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <TasksObligationsTableView hub={hub} />
    </div>
  )
}
