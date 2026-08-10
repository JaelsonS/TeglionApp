import type { AxiosInstance } from 'axios'

export type GoogleDrivePickerConfig = {
  configured: boolean
  apiKey: string | null
  clientId: string | null
}

export function createContabilGoogleDriveApi(api: AxiosInstance) {
  return {
    getConfig: () => api.get('/contabil/integrations/google-drive/config').then((r) => r.data as GoogleDrivePickerConfig),

    importFromDrive: (payload: { clientId: string; fileId: string; accessToken: string; body?: string }) =>
      api.post('/contabil/documents/import-from-drive', payload).then((r) => r.data),
  }
}

export type ContabilGoogleDriveApi = ReturnType<typeof createContabilGoogleDriveApi>
