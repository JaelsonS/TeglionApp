import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { contabilObligationsApi, contabilClientsApi, contabilFirmApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { readClientIdFromSearch } from '@/shared/utils/clientQueryParam'
import type { Client } from '@/shared/types/clients'
import type { OperationalLane, ObligationRow, ObligationTemplate } from './obligationOperational'
import { classifyLane } from './obligationOperational'

type DashboardData = {
  metrics?: {
    critical?: number
    upcoming?: number
    overdue?: number
    waitingClient?: number
    completed?: number
    dueToday?: number
    clientsAtRisk?: number
  }
  dueToday?: ObligationRow[]
  critical?: ObligationRow[]
  overdue?: ObligationRow[]
}

function readFilters(params: URLSearchParams) {
  const lane = params.get('lane')
  return {
    lane: (lane as OperationalLane) || null,
    clientId: readClientIdFromSearch(params),
    period: params.get('period'),
    obId: params.get('ob') || params.get('obligation'),
    showCreate: params.get('create') === '1',
    createType: params.get('createType'),
    createPeriod: params.get('createPeriod'),
    createDueDate: params.get('createDueDate'),
  }
}

export function useObligationsHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ObligationRow[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<ObligationTemplate[]>([])
  const [staff, setStaff] = useState<{ id: string; fullName?: string; email?: string }[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(filters.obId)
  const [monthExclusions, setMonthExclusions] = useState<
    Array<{ id: string; obligationId?: string; clientId: string; month: string }>
  >([])

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(patch)) {
          if (v == null || v === '') next.delete(k)
          else next.set(k, v)
        }
        return next
      })
    },
    [setSearchParams],
  )

  const load = useCallback(async (opts?: { includeExcluded?: boolean }) => {
    setLoading(true)
    try {
      const [listRes, dashRes, clientsRes, tplRes, staffRes] = await Promise.all([
        contabilObligationsApi.list({
          lane: filters.lane || undefined,
          clientId: filters.clientId || undefined,
          period: filters.period || undefined,
          includeExcluded: opts?.includeExcluded ? '1' : undefined,
        }) as Promise<{
          items?: ObligationRow[]
          monthExclusions?: Array<{ id: string; obligationId?: string; clientId: string; month: string }>
        }>,
        contabilObligationsApi.getOperationalDashboard() as Promise<DashboardData>,
        contabilClientsApi.list({ page: 1, limit: 200 }) as Promise<{ items?: Client[] }>,
        contabilObligationsApi.listTemplates() as Promise<{ items?: ObligationTemplate[] }>,
        contabilFirmApi.listStaff() as Promise<{ items?: { id: string; fullName?: string; email?: string }[] }>,
      ])
      const rows = (listRes.items || []).map((o) => ({
        ...o,
        operationalLane: o.operationalLane || classifyLane(o),
      }))
      setItems(rows)
      setMonthExclusions(listRes.monthExclusions || [])
      setDashboard(dashRes)
      setClients(clientsRes.items || [])
      setTemplates(tplRes.items || [])
      setStaff(staffRes.items || [])
    } catch (err) {
      toast.error('Erro ao carregar obrigações', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [filters.lane, filters.clientId, filters.period])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setSelectedId(filters.obId)
  }, [filters.obId])

  const selectObligation = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      updateParams({ ob: id, create: null })
    },
    [updateParams],
  )

  const hydrateObligationDetail = useCallback((detail: Partial<ObligationRow> & { _id?: string; id?: string }) => {
    const detailId = String(detail._id || detail.id || '')
    if (!detailId) return
    setItems((prev) =>
      prev.map((row) =>
        row._id === detailId || row.id === detailId
          ? {
            ...row,
            ...detail,
            _id: row._id,
            id: row.id,
          }
          : row,
      ),
    )
  }, [])

  const selected = useMemo(
    () => items.find((o) => o._id === selectedId) || null,
    [items, selectedId],
  )

  const clientById = useMemo(() => new Map(clients.map((c) => [c._id, c])), [clients])

  const metrics = dashboard?.metrics || {
    critical: 0,
    upcoming: 0,
    overdue: 0,
    waitingClient: 0,
    completed: 0,
    dueToday: 0,
    clientsAtRisk: 0,
  }

  return {
    filters,
    updateParams,
    loading,
    items,
    monthExclusions,
    dashboard,
    metrics,
    clients,
    clientById,
    templates,
    staff,
    selected,
    selectedId,
    selectObligation,
    hydrateObligationDetail,
    refresh: load,
  }
}
