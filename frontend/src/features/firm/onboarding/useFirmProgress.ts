import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/shared/hooks/useAuth'
import { useFirmDashboard } from '@/shared/hooks/queries/useFirmDashboard'
import { contabilAccountingServicesApi, contabilConsultationsApi, contabilFirmApi, contabilServiceInquiriesApi } from '@/infrastructure/api'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { firmPublicSiteApi } from '@/infrastructure/api/contabil/firmPublicSite'
import type { AccountingService, FirmBookingSettings } from '@/shared/types/contabil'
import { computeFirmProgress, type FirmProgressResult } from './firmProgress'

function extractServices(payload: unknown): AccountingService[] {
  if (Array.isArray(payload)) return payload as AccountingService[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: AccountingService[] }).items
  }
  return []
}

function hasConfiguredBooking(bookingPayload: unknown): boolean {
  const booking = (bookingPayload as { booking?: FirmBookingSettings } | null)?.booking
  if (!booking) return false
  const schedule = booking.schedule
  if (schedule && typeof schedule === 'object') {
    return Object.values(schedule).some((slots) => Array.isArray(slots) && slots.length > 0)
  }
  return Array.isArray(booking.weekdays) && booking.weekdays.length > 0
}

/**
 * Sinais reais do escritório → progresso / próximo passo (onboarding + Dashboard).
 */
export function useFirmProgress(enabled = true): {
  loading: boolean
  progress: FirmProgressResult | null
  refresh: () => void
} {
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug ?? ''
  const dashboard = useFirmDashboard(enabled && Boolean(user))

  const firmQuery = useQuery({
    queryKey: ['firm-progress', 'branding', firmSlug],
    queryFn: () => contabilFirmApi.getFirm(),
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  })

  const siteQuery = useQuery({
    queryKey: ['firm-progress', 'public-site', firmSlug],
    queryFn: () => firmPublicSiteApi.get(),
    enabled: enabled && Boolean(user),
    staleTime: 30_000,
  })

  const servicesQuery = useQuery({
    queryKey: ['firm-progress', 'services', firmSlug],
    queryFn: () => contabilAccountingServicesApi.list(),
    enabled: enabled && Boolean(user),
    staleTime: 30_000,
  })

  const bookingQuery = useQuery({
    queryKey: ['firm-progress', 'booking', firmSlug],
    queryFn: () => contabilConsultationsApi.getBookingSettings(),
    enabled: enabled && Boolean(user),
    staleTime: 60_000,
  })

  const clientsQuery = useFirmClientsDirectory({ limit: 500, enabled })

  const inquiriesQuery = useQuery({
    queryKey: ['firm-progress', 'inquiries', firmSlug],
    queryFn: () => contabilServiceInquiriesApi.list({ status: 'NEW' }),
    enabled: enabled && Boolean(user),
    staleTime: 30_000,
  })

  const loading =
    dashboard.isLoading ||
    firmQuery.isLoading ||
    siteQuery.isLoading ||
    servicesQuery.isLoading ||
    bookingQuery.isLoading

  const progress = useMemo(() => {
    if (!user) return null

    const services = extractServices(servicesQuery.data)
    const publicServiceCount = services.filter((s) => s.isPubliclyListed && s.isActive !== false).length
    const hasLogo = Boolean(
      firmQuery.data?.firm?.branding?.logoUrl ||
        (firmQuery.data as { logoUrl?: string } | undefined)?.logoUrl,
    )
    const clients = clientsQuery.data?.items ?? []
    const hasPortalInvite = clients.some((c) => {
      const status = String((c as { portalAccessStatus?: string }).portalAccessStatus || '')
      return status === 'PENDING_INVITE' || status === 'ACTIVE'
    })
    const inquiryItems =
      (inquiriesQuery.data as { items?: unknown[] } | unknown[] | undefined)
    const pendingCount = Array.isArray(inquiryItems)
      ? inquiryItems.length
      : Array.isArray((inquiryItems as { items?: unknown[] })?.items)
        ? (inquiryItems as { items: unknown[] }).items.length
        : 0

    return computeFirmProgress({
      hasLogo,
      firmSlug: firmSlug || null,
      publicSitePublished: Boolean(siteQuery.data?.publishedAt),
      serviceCount: services.length,
      publicServiceCount,
      hasBookingSchedule: hasConfiguredBooking(bookingQuery.data),
      clientCount: dashboard.data?.totalClients ?? 0,
      hasPortalInvite,
      overdueCount: dashboard.data?.obligations?.overdue ?? 0,
      pendingInquiriesHint: pendingCount > 0,
    })
  }, [
    user,
    firmSlug,
    firmQuery.data,
    siteQuery.data?.publishedAt,
    servicesQuery.data,
    bookingQuery.data,
    clientsQuery.data,
    inquiriesQuery.data,
    dashboard.data?.totalClients,
    dashboard.data?.obligations?.overdue,
  ])

  return {
    loading,
    progress,
    refresh: () => {
      void dashboard.refetch()
      void firmQuery.refetch()
      void siteQuery.refetch()
      void servicesQuery.refetch()
      void bookingQuery.refetch()
      void clientsQuery.refetch()
      void inquiriesQuery.refetch()
    },
  }
}
