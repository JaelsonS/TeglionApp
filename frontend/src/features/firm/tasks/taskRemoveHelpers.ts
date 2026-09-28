import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'

export function taskHasRecurrenceSeries(task: WorkspaceTask) {
  return Boolean(
    task.recurringRuleId ||
      (task.recurrenceRule && typeof task.recurrenceRule === 'object' && task.recurrenceRule.ruleId),
  )
}
