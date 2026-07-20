import type { AxiosInstance } from 'axios'

export function createContabilFirmApi(api: AxiosInstance) {
  return {
    getMe: () =>
      api.get('/contabil/firm').then((r) => {
        const row = (r.data as { firm?: Record<string, unknown> }).firm
        if (!row) return row
        const trialRaw = row.trialEndsAt ?? row.trial_ends_at
        return {
          ...row,
          _id: row.id,
          id: row.id,
          status: row.status,
          billing: { trialEndsAt: trialRaw },
        }
      }),

    getFirm: () =>
      api
        .get('/contabil/firm')
        .then(
          (r) =>
            r.data as {
              firm: { id: string; name: string; countryCode?: string; branding?: { logoUrl?: string | null } }
              logoUrl?: string | null
            },
        ),

    uploadFirmLogo: (file: File) => {
      const fd = new FormData()
      fd.append('logo', file)
      return api.post('/contabil/firm/logo', fd).then((r) => r.data)
    },

    removeFirmLogo: () => api.delete('/contabil/firm/logo').then((r) => r.data as { logoUrl: null }),

    getDashboard: () => api.get('/contabil/dashboard').then((r) => r.data),

    listStaff: () => api.get('/contabil/firm/staff').then((r) => r.data),

    listCaeHistory: () =>
      api.get('/contabil/firm/cae-history').then((r) => r.data as { items: string[] }),

    rememberCae: (cae: string) =>
      api.post('/contabil/firm/cae-history', { cae }).then((r) => r.data as { items: string[] }),

    searchCae: (q: string) =>
      api
        .get('/contabil/firm/cae-search', { params: { q } })
        .then(
          (r) =>
            r.data as {
              items: Array<{ code: string; label: string; value: string; source?: string }>
              source?: string
            },
        ),

    register: (payload: {
      firmName: string
      ownerName: string
      email: string
      password: string
      countryCode?: string
      legalConsents: {
        terms: boolean
        privacy: boolean
        dpa: boolean
        cookies: boolean
        versions: {
          terms: string
          privacy: string
          dpa: string
          cookies: string
        }
      }
    }) => api.post('/auth/register-firm', payload).then((r) => r.data),

    registerWithGoogle: (payload: {
      firmName: string
      ownerName?: string
      countryCode?: string
      legalConsents: {
        terms: boolean
        privacy: boolean
        dpa: boolean
        cookies: boolean
        versions: {
          terms: string
          privacy: string
          dpa: string
          cookies: string
        }
      }
    }) => api.post('/auth/register-firm-google', payload).then((r) => r.data),
  }
}

export type ContabilFirmApi = ReturnType<typeof createContabilFirmApi>
