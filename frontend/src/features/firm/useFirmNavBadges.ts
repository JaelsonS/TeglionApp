/**
 * Contadores de atenção do sidebar do escritório — uma query por badge-key.
 * Mensagens já existiam; alargamos a Solicitações, Agenda, Documentos, Tarefas e Obrigações.
 */
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { useAuth } from '@/shared/hooks/useAuth'
import { onAppDataChanged } from '@/shared/utils/appEvents'
import {
  contabilConsultationsApi,
  contabilDocumentsApi,
  contabilMessagesApi,
  contabilObligationsApi,
  contabilServiceInquiriesApi,
} from '@/infrastructure/api'
import { tasksApi } from '@/infrastructure/api/contabil/tasks'
import type { FirmNavItemConfig } from '@/features/firm/firmNavConfig'

export const FIRM_MESSAGES_UNREAD_KEY = 'firm-messages-unread'
export const FIRM_INQUIRIES_UNSEEN_QUERY_KEY = ['contabil-service-inquiries', 'unseen-count'] as const

function visiblePollInterval(ms: number | false) {
  return (q: { state: { error: unknown } }) => {
    if (document.visibilityState !== 'visible') return false
    if (isAxiosError(q.state.error) && q.state.error.response?.status === 429) return false
    return ms
  }
}

function retryUnless429(failureCount: number, error: unknown) {
  if (isAxiosError(error) && error.response?.status === 429) return false
  return failureCount < 1
}

export function useFirmMessagesUnread() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: [FIRM_MESSAGES_UNREAD_KEY, user?.id],
    queryFn: () => contabilMessagesApi.getUnreadSummary(),
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    refetchInterval: visiblePollInterval(false),
    retry: retryUnless429,
  })
  useEffect(() => {
    if (!user?.id) return
    return onAppDataChanged((detail) => {
      if (
        !detail.scope ||
        detail.scope === 'messages' ||
        detail.scope === 'internal-messages' ||
        detail.scope === 'document-requests' ||
        detail.scope === 'live'
      ) {
        void qc.invalidateQueries({ queryKey: [FIRM_MESSAGES_UNREAD_KEY, user.id] })
      }
    })
  }, [qc, user?.id])
  return query.data?.total ?? 0
}

export function useFirmServiceInquiriesUnseen() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: [...FIRM_INQUIRIES_UNSEEN_QUERY_KEY, user?.id],
    queryFn: () => contabilServiceInquiriesApi.getUnseenCount(),
    enabled: Boolean(user?.id),
    staleTime: 15_000,
    refetchInterval: visiblePollInterval(60_000),
    retry: retryUnless429,
  })
  useEffect(() => {
    if (!user?.id) return
    return onAppDataChanged((detail) => {
      if (!detail.scope || detail.scope === 'live' || detail.scope === 'service-inquiries') {
        void qc.invalidateQueries({ queryKey: FIRM_INQUIRIES_UNSEEN_QUERY_KEY })
      }
    })
  }, [qc, user?.id])
  return query.data?.count ?? 0
}

export function useFirmConsultationsAttention() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['firm-consultations-attention', user?.id],
    queryFn: () => contabilConsultationsApi.getAttentionCount(),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: visiblePollInterval(60_000),
    retry: retryUnless429,
  })
  return query.data?.count ?? 0
}

export function useFirmDocumentsPending() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['firm-documents-pending', user?.id],
    queryFn: async () => {
      const data = await contabilDocumentsApi.list({ validationStatus: 'PENDING', limit: 1 })
      return Number((data as { total?: number }).total ?? (data as { items?: unknown[] }).items?.length ?? 0)
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: visiblePollInterval(60_000),
    retry: retryUnless429,
  })
  return query.data ?? 0
}

export function useFirmTasksAttention() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['firm-tasks-attention', user?.id],
    queryFn: async () => {
      const m = await tasksApi.getMetrics()
      return Number(m.overdue || 0) + Number(m.critical || 0)
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: visiblePollInterval(90_000),
    retry: retryUnless429,
  })
  return query.data ?? 0
}

export function useFirmObligationsAttention() {
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['firm-obligations-attention', user?.id],
    queryFn: async () => {
      const data = await contabilObligationsApi.getOperationalDashboard()
      const metrics = (data as { metrics?: { critical?: number; overdue?: number } }).metrics
      return Number(metrics?.critical || 0) + Number(metrics?.overdue || 0)
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: visiblePollInterval(90_000),
    retry: retryUnless429,
  })
  return query.data ?? 0
}

export type FirmNavBadgeCounts = {
  messages: number
  serviceInquiries: number
  consultations: number
  documents: number
  tasks: number
  obligations: number
}

export function useFirmNavBadgeCounts(): FirmNavBadgeCounts {
  return {
    messages: useFirmMessagesUnread(),
    serviceInquiries: useFirmServiceInquiriesUnseen(),
    consultations: useFirmConsultationsAttention(),
    documents: useFirmDocumentsPending(),
    tasks: useFirmTasksAttention(),
    obligations: useFirmObligationsAttention(),
  }
}

export function resolveFirmNavBadge(item: FirmNavItemConfig, counts: FirmNavBadgeCounts): number | undefined {
  switch (item.badgeKey) {
    case 'messages':
      return counts.messages
    case 'serviceInquiries':
      return counts.serviceInquiries
    case 'consultations':
      return counts.consultations
    case 'documents':
      return counts.documents
    case 'tasks':
      return counts.tasks
    case 'obligations':
      return counts.obligations
    default:
      return undefined
  }
}
