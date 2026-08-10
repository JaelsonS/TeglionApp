import type { AxiosInstance } from 'axios'

export type GoogleCalendarStatus = {
  configured: boolean
  connected: boolean
  googleEmail: string | null
}

export function createContabilGoogleCalendarApi(api: AxiosInstance) {
  return {
    getStatus: () =>
      api.get('/contabil/integrations/google-calendar/status').then((r) => r.data as GoogleCalendarStatus),

    disconnect: () =>
      api
        .post('/contabil/integrations/google-calendar/disconnect')
        .then((r) => r.data as { disconnected: boolean }),
  }
}

export type ContabilGoogleCalendarApi = ReturnType<typeof createContabilGoogleCalendarApi>
