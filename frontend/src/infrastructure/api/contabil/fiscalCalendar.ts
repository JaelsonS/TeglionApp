import type { AxiosInstance } from 'axios'

export type FirmFiscalRecurrence = {
  id?: string
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
  intervalCount?: number
  dayOfMonth?: number | null
  dayOfWeek?: number | null
  monthOfYear?: number | null
  untilDate?: string | null
  countLimit?: number | null
}

export type FirmFiscalCategory = {
  id: string
  name: string
  colorToken: string
  sortOrder: number
  isActive: boolean
}

export type FirmFiscalEvent = {
  id: string
  categoryId?: string | null
  title: string
  description?: string | null
  notes?: string | null
  startDate: string
  startTime?: string | null
  endTime?: string | null
  eventKind: 'FISCAL' | 'INTERNAL'
  status: 'SCHEDULED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  colorToken?: string | null
  authority?: string | null
  periodLabel?: string | null
  regimes?: string[]
  sourceTemplateKey?: string | null
  isActive: boolean
  archivedAt?: string | null
  recurrence?: FirmFiscalRecurrence | null
  occurrenceDate?: string
  occurrenceId?: string
  isRecurring?: boolean
  isException?: boolean
}

export type FirmFiscalCalendar = {
  id: string
  name: string
  description?: string | null
  preferences?: {
    defaultView?: 'month' | 'list' | 'year'
    firstDayOfWeek?: number
    showInternalEvents?: boolean
  }
  isActive: boolean
}

export type FirmFiscalWorkspace = {
  calendar: FirmFiscalCalendar
  categories: FirmFiscalCategory[]
  colorPalette: string[]
  events: FirmFiscalEvent[]
  series: FirmFiscalEvent[]
  summary: { upcoming7: number; upcoming30: number; totalInRange: number }
  range: { from: string; to: string }
}

export function createContabilFiscalCalendarApi(api: AxiosInstance) {
  return {
    getNational: (year: number) =>
      api.get('/contabil/fiscal-calendar', { params: { year } }).then((r) => r.data),

    getYears: () => api.get('/contabil/fiscal-calendar/years').then((r) => r.data),

    getWorkspace: (params: {
      from: string
      to: string
      categoryId?: string | null
      eventKind?: string | null
      status?: string | null
      search?: string | null
      includeInactive?: boolean
      includeArchived?: boolean
    }) =>
      api
        .get<FirmFiscalWorkspace>('/contabil/fiscal-calendar/workspace', {
          params: {
            from: params.from,
            to: params.to,
            categoryId: params.categoryId || undefined,
            eventKind: params.eventKind || undefined,
            status: params.status || undefined,
            search: params.search || undefined,
            includeInactive: params.includeInactive ? '1' : undefined,
            includeArchived: params.includeArchived ? '1' : undefined,
          },
        })
        .then((r) => r.data),

    updateWorkspace: (payload: Record<string, unknown>) =>
      api.patch('/contabil/fiscal-calendar/workspace', payload).then((r) => r.data),

    importTemplate: (year?: number) =>
      api.post('/contabil/fiscal-calendar/import-template', { year }).then((r) => r.data),

    listCategories: (includeInactive?: boolean) =>
      api
        .get('/contabil/fiscal-calendar/categories', {
          params: includeInactive ? { includeInactive: '1' } : undefined,
        })
        .then((r) => r.data),

    createCategory: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal-calendar/categories', payload).then((r) => r.data),

    updateCategory: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/fiscal-calendar/categories/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    getEvent: (id: string) =>
      api.get(`/contabil/fiscal-calendar/events/${encodeURIComponent(id)}`).then((r) => r.data),

    createEvent: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal-calendar/events', payload).then((r) => r.data),

    updateEvent: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/fiscal-calendar/events/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    duplicateEvent: (id: string, overrides?: Record<string, unknown>) =>
      api
        .post(`/contabil/fiscal-calendar/events/${encodeURIComponent(id)}/duplicate`, overrides || {})
        .then((r) => r.data),

    archiveEvent: (id: string) =>
      api.post(`/contabil/fiscal-calendar/events/${encodeURIComponent(id)}/archive`).then((r) => r.data),

    setEventActive: (id: string, isActive: boolean) =>
      api
        .post(`/contabil/fiscal-calendar/events/${encodeURIComponent(id)}/active`, { isActive })
        .then((r) => r.data),

    createException: (id: string, payload: Record<string, unknown>) =>
      api
        .post(`/contabil/fiscal-calendar/events/${encodeURIComponent(id)}/exceptions`, payload)
        .then((r) => r.data),
  }
}

export type ContabilFiscalCalendarApi = ReturnType<typeof createContabilFiscalCalendarApi>
