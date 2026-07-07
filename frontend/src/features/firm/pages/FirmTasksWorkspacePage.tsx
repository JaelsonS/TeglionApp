import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { teamApi } from '@/infrastructure/api/contabil/tasks'
import type { WorkspaceTask, WorkspaceTaskStatus } from '@/infrastructure/api/contabil/tasks'
import { useObligationsHub } from '@/features/firm/obligations/useObligationsHub'
import { TaskDetailPanel } from '@/features/firm/tasks/TaskDetailPanel'
import { TasksByClientTableView } from '@/features/firm/tasks/TasksByClientTableView'
import { TasksManualView } from '@/features/firm/tasks/TasksManualView'
import { TasksObligationsView } from '@/features/firm/tasks/TasksObligationsView'
import { TasksOperationsCalendarView } from '@/features/firm/tasks/TasksOperationsCalendarView'
import { TasksOverviewPanel } from '@/features/firm/tasks/TasksOverviewPanel'
import { TasksWorkspaceShell } from '@/features/firm/tasks/TasksWorkspaceShell'
import { firmTasksPath, parseTasksTabFromPathname } from '@/features/firm/tasks/firmTasksPaths'
import {
  computeOverviewKpis,
  type TasksOperationsTab,
} from '@/features/firm/tasks/tasksOperationsUtils'
import {
  optimisticMoveTask,
  tasksWorkspaceKeys,
  useCreateTask,
  usePatchTask,
  useTasksWorkspace,
} from '@/shared/hooks/queries/useTasksWorkspace'
import { readClientIdFromSearch } from '@/shared/utils/clientQueryParam'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { contabilClientsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { Client } from '@/shared/types/clients'

type ManualViewMode = 'board' | 'grid'

export function FirmTasksWorkspacePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tab = parseTasksTabFromPathname(location.pathname)

  useEffect(() => {
    if (location.pathname === '/app/firm/tasks' || location.pathname === '/app/firm/tasks/') {
      navigate(firmTasksPath('overview'), { replace: true })
    }
  }, [location.pathname, navigate])

  const clientFilter = readClientIdFromSearch(searchParams) || undefined
  const openTaskId = searchParams.get('task')

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '')
  const [manualView, setManualView] = useState<ManualViewMode>(
    (searchParams.get('view') === 'grid' ? 'grid' : 'board') as ManualViewMode,
  )
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    clientId: clientFilter || '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'NORMAL',
    assigneeId: '',
    obligationId: '',
    recurrenceFrequency: 'NONE',
  })

  const obligationsHub = useObligationsHub()
  const showCreateForm = tab === 'manual' && searchParams.get('create') === '1'

  const navigateTasks = useCallback(
    (patch: Record<string, string | null>, opts?: { tab?: TasksOperationsTab }) => {
      const nextTab = opts?.tab ?? tab
      const params = new URLSearchParams(searchParams)
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k)
        else params.set(k, v)
      }
      params.delete('tab')
      params.delete('kind')
      params.delete('section')
      if (nextTab !== 'manual' && nextTab !== 'clients') params.delete('task')
      if (nextTab !== 'obligations') params.delete('ob')
      navigate({
        pathname: firmTasksPath(nextTab),
        search: params.toString() ? `?${params}` : '',
      })
    },
    [navigate, searchParams, tab],
  )

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      navigateTasks(patch)
    },
    [navigateTasks],
  )

  const openCreateTask = useCallback(() => {
    navigateTasks({ create: '1', task: null, ob: null }, { tab: 'manual' })
  }, [navigateTasks])

  const closeCreateTask = useCallback(() => {
    navigateTasks({ create: null })
  }, [navigateTasks])

  const openCreateRecurringObligation = useCallback(() => {
    navigateTasks({ create: '1', ob: null, task: null }, { tab: 'obligations' })
  }, [navigateTasks])

  const setTab = (next: TasksOperationsTab) => {
    const params = new URLSearchParams(searchParams)
    if (tab !== next) params.delete('create')
    if (next !== 'manual' && next !== 'clients') params.delete('task')
    if (next !== 'obligations') params.delete('ob')
    params.delete('tab')
    params.delete('kind')
    navigate({
      pathname: firmTasksPath(next),
      search: params.toString() ? `?${params}` : '',
    })
  }

  const { data: teamData } = useQuery({
    queryKey: ['firm-team'],
    queryFn: () => teamApi.list(),
    staleTime: 120_000,
  })
  const teamNames = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of teamData?.items || []) m.set(u.id, u.fullName || u.email)
    return m
  }, [teamData])

  useEffect(() => {
    void contabilClientsApi.list({ page: 1, limit: 500 }).then((r: { items?: Client[] }) => {
      setClients(r.items || [])
    })
  }, [])

  const { data, isLoading, isFetching } = useTasksWorkspace({
    search: search || undefined,
    clientId: clientFilter,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  })
  const patchTask = usePatchTask()
  const createTask = useCreateTask()
  const qc = useQueryClient()

  const allItems = data?.items ?? []
  const manualItems = useMemo(
    () => allItems.filter((t) => (t.taskType || 'internal_task') === 'internal_task'),
    [allItems],
  )
  const [localItems, setLocalItems] = useState<WorkspaceTask[] | null>(null)
  const displayItems = localItems ?? manualItems

  const overviewKpis = useMemo(
    () => computeOverviewKpis(obligationsHub.items, manualItems),
    [obligationsHub.items, manualItems],
  )

  const invalidate = useCallback(() => {
    setLocalItems(null)
    void qc.invalidateQueries({ queryKey: tasksWorkspaceKeys.all })
    void obligationsHub.refresh()
  }, [qc, obligationsHub])

  const onStatusChange = useCallback(
    (taskId: string, status: WorkspaceTaskStatus) => {
      setLocalItems(optimisticMoveTask(displayItems, taskId, status))
      patchTask.mutate(
        { id: taskId, patch: { status } },
        {
          onError: (e) => {
            setLocalItems(null)
            toast.error(getErrorMessage(e))
          },
          onSettled: () => setLocalItems(null),
        },
      )
    },
    [displayItems, patchTask],
  )

  const selectTask = (t: WorkspaceTask) => {
    const nextTab = tab === 'overview' || tab === 'calendar' ? 'manual' : tab
    navigateTasks({ task: t.id, create: null }, { tab: nextTab })
  }

  const selectObligation = (id: string) => {
    obligationsHub.selectObligation(id)
    navigateTasks({ ob: id, task: null }, { tab: 'obligations' })
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId || !form.title.trim()) {
      toast.error('Cliente e título obrigatórios')
      return
    }
    const recurrenceRule =
      form.recurrenceFrequency && form.recurrenceFrequency !== 'NONE'
        ? { frequency: form.recurrenceFrequency }
        : null
    createTask.mutate(
      {
        payload: {
          clientId: form.clientId,
          title: form.title.trim(),
          description: form.description || undefined,
          dueDate: form.dueDate || undefined,
          priority: form.priority,
          assigneeId: form.assigneeId || undefined,
          obligationId: form.obligationId || undefined,
          recurrenceRule: recurrenceRule || undefined,
          taskType: 'internal_task',
          notifyClient: false,
          status: 'TODO',
        },
      },
      {
        onSuccess: () => {
          toast.success('Tarefa criada')
          closeCreateTask()
          navigateTasks({}, { tab: 'manual' })
          setForm({
            clientId: clientFilter || '',
            title: '',
            description: '',
            dueDate: '',
            priority: 'NORMAL',
            assigneeId: '',
            obligationId: '',
            recurrenceFrequency: 'NONE',
          })
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    )
  }

  const headerAction =
    tab === 'manual' || tab === 'calendar' ? (
      <Button type="button" className="h-8 rounded-md px-3.5 text-xs" onClick={openCreateTask}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Nova tarefa
      </Button>
    ) : null

  return (
    <FirmWorkspacePage className="cb-tasks-page xl:min-h-0 xl:flex-1">
      <TasksWorkspaceShell activeTab={tab} headerAction={headerAction}>
        {tab === 'overview' ? (
          <TasksOverviewPanel
            kpis={overviewKpis}
            obligations={obligationsHub.items}
            manualTasks={manualItems}
            teamNames={teamNames}
            onSelectObligation={selectObligation}
            onSelectTask={selectTask}
            onNavigateCalendar={() => setTab('calendar')}
          />
        ) : null}

        {tab === 'obligations' ? <TasksObligationsView hub={obligationsHub} /> : null}

        {tab === 'manual' ? (
          <TasksManualView
            items={displayItems}
            loading={isLoading}
            isFetching={isFetching}
            openTaskId={openTaskId}
            search={search}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            view={manualView}
            showForm={showCreateForm}
            form={form}
            clients={clients}
            teamItems={teamData?.items || []}
            teamNames={teamNames}
            onSearchChange={(q) => {
              setSearch(q)
              updateParams({ q: q || null })
            }}
            onStatusChange={(s) => {
              setStatusFilter(s)
              updateParams({ status: s || null })
            }}
            onPriorityChange={(p) => {
              setPriorityFilter(p)
              updateParams({ priority: p || null })
            }}
            onViewChange={(v) => {
              setManualView(v)
              updateParams({ view: v })
            }}
            onSelectTask={selectTask}
            onTaskStatusChange={onStatusChange}
            onCompleteTask={(id) => onStatusChange(id, 'DONE')}
            onShowForm={openCreateTask}
            onHideForm={closeCreateTask}
            onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            onCreateSubmit={handleCreate}
            createPending={createTask.isPending}
            embeddedInShell
          />
        ) : null}

        {tab === 'calendar' ? (
          <TasksOperationsCalendarView
            obligations={obligationsHub.items}
            manualTasks={manualItems}
            onSelectObligation={selectObligation}
            onSelectTask={selectTask}
            onNewTask={openCreateTask}
          />
        ) : null}

        {tab === 'clients' ? (
          <TasksByClientTableView
            clients={clients}
            obligations={obligationsHub.items}
            manualTasks={manualItems}
            teamNames={teamNames}
            onSelectClient={(id) => navigate(`/app/firm/clients/${encodeURIComponent(id)}`)}
          />
        ) : null}
      </TasksWorkspaceShell>

      {Boolean(openTaskId) && tab !== 'obligations' ? (
        <Sheet open onOpenChange={(o: { id?: string; value?: string; label?: string;[key: string]: unknown }) => !o && updateParams({ task: null })}>
          <SheetContent side="right" className="flex h-full max-h-dvh w-full flex-col p-0 sm:max-w-lg">
            <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-3 text-left">
              <SheetTitle className="text-base">Detalhe da tarefa</SheetTitle>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-hidden">
              <TaskDetailPanel
                embedded
                taskId={openTaskId}
                teamNames={teamNames}
                onClose={() => updateParams({ task: null })}
                onMutate={invalidate}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </FirmWorkspacePage>
  )
}
