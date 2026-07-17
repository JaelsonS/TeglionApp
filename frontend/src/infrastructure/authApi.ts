import { broadcastAuthLogout } from '@/shared/utils/authRefreshCoordinator'
import { logger } from '@/shared/utils/logger'

import { api, getApiBaseUrlResolved, refreshAccessToken, refreshApi } from '@/infrastructure/http/apiClient'
import { CSRF_HEADER_NAME, ensureCsrfToken } from '@/infrastructure/http/csrf'

export const authApi = {
  recover: async (payload: { email: string; country?: string; locale?: string; role?: string }) => {
    logger.info('Iniciando recuperacao de senha...')
    const csrfToken = await ensureCsrfToken(refreshApi)

    return fetch(`${getApiBaseUrlResolved()}/auth/recover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
      .then(async (response) => {
        const text = await response.text()
        let data: Record<string, unknown> = {}
        try {
          data = text ? (JSON.parse(text) as Record<string, unknown>) : {}
        } catch {
          data = { message: text }
        }
        if (!response.ok) {
          throw {
            message: String(data.message || data.error || `Erro ${response.status}`),
            response: {
              status: response.status,
              data: {
                ...data,
                code: data.code,
                message: data.message || data.error,
              },
            },
          }
        }
        return data
      })
      .then((data) => {
        logger.info('Recuperacao processada', data)
        return data
      })
      .catch((error) => {
        logger.error('Erro na recuperacao', error)
        if (error?.response?.status) throw error
        throw { message: error?.message || String(error), response: { data: { error: error?.message } } }
      })
  },

  loginFirm: (payload: {
    email: string
    password: string
    country?: string
    locale?: string
    rememberMe?: boolean
  }) => api.post('/auth/login-firm', payload).then((r) => r.data),

  loginClient: (payload: {
    email: string
    password: string
    phone?: string
    country?: string
    locale?: string
    rememberMe?: boolean
    firmSlug?: string
  }) => api.post('/auth/login-client', payload).then((r) => r.data),

  registerFirm: (payload: { firmName: string; fullName: string; email: string; password: string }) =>
    api
      .post('/auth/register-firm', {
        firmName: payload.firmName,
        ownerName: payload.fullName,
        email: payload.email,
        password: payload.password,
      })
      .then((r) => r.data),

  refresh: () => refreshAccessToken().then((ok) => ({ ok })),

  logout: async () => {
    broadcastAuthLogout()
    const csrfToken = await ensureCsrfToken(refreshApi)
    return refreshApi
      .post('/auth/logout', null, {
        headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
      })
      .then((r) => r.data)
  },

  me: () => api.get('/auth/me').then((r) => r.data),

  completeOnboarding: () => api.post('/auth/complete-onboarding').then((r) => r.data),

  reset: (payload: { token: string; newPassword: string; country?: string; locale?: string }) =>
    api.post('/auth/reset', payload, { timeout: 15000 }).then((r) => r.data),
}
