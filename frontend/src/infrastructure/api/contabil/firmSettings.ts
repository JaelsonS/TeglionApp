import { api } from '@/infrastructure/api'
import type {
  FirmSettingsBundle,
  PatchFirmProfilePayload,
  PatchFirmSettingsPayload,
} from '@/shared/types/firmSettings'

export const firmSettingsApi = {
  get: () => api.get('/contabil/firm/settings').then((r) => r.data as FirmSettingsBundle),

  patchFirm: (payload: PatchFirmSettingsPayload) =>
    api.patch('/contabil/firm/settings', payload).then((r) => r.data),

  patchProfile: (payload: PatchFirmProfilePayload) =>
    api.patch('/contabil/firm/profile', payload).then((r) => r.data as { profile: { id: string; email: string; fullName: string; firmRole: string } }),

  closeAccount: (payload: { confirmName: string; npsScore: number; npsReason?: string | null; npsComment?: string | null }) =>
    api.post('/contabil/firm/close', payload).then((r) => r.data as { closed: boolean; message: string }),
}
