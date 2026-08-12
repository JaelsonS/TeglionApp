import type { AxiosInstance } from 'axios'

export type GoogleCalendarAuthStatus = 'ok' | 'needs_reconnect'

export type GoogleCalendarStatus = {
  configured: boolean
  connected: boolean
  authStatus: GoogleCalendarAuthStatus | null
  googleEmail: string | null
  calendarId: string | null
  calendarSummary: string | null
  lastAuthError: string | null
  publicSyncEnabled: boolean
  publicSyncStaffUserId: string | null
}

export type GoogleCalendarListItem = {
  id: string
  summary: string
  primary: boolean
  accessRole: string | null
}

export function createContabilGoogleCalendarApi(api: AxiosInstance) {
  return {
    getStatus: () =>
      api.get('/contabil/integrations/google-calendar/status').then((r) => r.data as GoogleCalendarStatus),

    disconnect: () =>
      api
        .post('/contabil/integrations/google-calendar/disconnect')
        .then((r) => r.data as { disconnected: boolean }),

    listCalendars: () =>
      api
        .get('/contabil/integrations/google-calendar/calendars')
        .then((r) => r.data as { calendars: GoogleCalendarListItem[] }),

    selectCalendar: (payload: { calendarId: string; calendarSummary?: string | null }) =>
      api
        .patch('/contabil/integrations/google-calendar/calendar', payload)
        .then((r) => r.data as { calendarId: string; calendarSummary: string | null }),

    setPublicSync: (enabled: boolean) =>
      api
        .patch('/contabil/integrations/google-calendar/public-sync', { enabled })
        .then((r) => r.data as { publicSyncEnabled: boolean }),
  }
}

export type ContabilGoogleCalendarApi = ReturnType<typeof createContabilGoogleCalendarApi>
