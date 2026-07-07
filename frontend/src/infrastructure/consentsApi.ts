import { api } from '@/infrastructure/http/apiClient'

export const consentsApi = {
  getCookies: () => api.get('/consents/cookies').then((r) => r.data),
  acceptCookies: (payload: { version: string; locale?: string }) =>
    api.post('/consents/cookies', payload).then((r) => r.data),
}
