import type { useObligationsHub } from '@/features/firm/obligations/useObligationsHub'
import { TasksObligationsTableView } from '@/features/firm/tasks/TasksObligationsTableView'

type Hub = ReturnType<typeof useObligationsHub>

export function TasksObligationsView({ hub }: { hub: Hub }) {
  return (
    <div className="flex w-full min-w-0 flex-col">
      <TasksObligationsTableView hub={hub} />
    </div>
  )
}
