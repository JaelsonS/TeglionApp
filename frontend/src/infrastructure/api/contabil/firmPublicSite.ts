import { api } from '@/infrastructure/api'
import type { FirmPublicSiteBundle, PublicSiteConfig, PublicSiteImageRef } from '@/shared/types/firmPublicSite'

export const firmPublicSiteApi = {
  get: () => api.get('/contabil/firm/public-site').then((r) => r.data as FirmPublicSiteBundle),

  saveDraft: (config: PublicSiteConfig) =>
    api
      .patch('/contabil/firm/public-site/draft', config)
      .then((r) => r.data as { draft: PublicSiteConfig; draftUpdatedAt: string }),

  publish: () =>
    api
      .post('/contabil/firm/public-site/publish')
      .then((r) => r.data as { published: PublicSiteConfig; publishedAt: string }),

  regeneratePreviewToken: () =>
    api
      .post('/contabil/firm/public-site/preview-token')
      .then((r) => r.data as { previewToken: string; previewTokenExpiresAt: string }),

  uploadImage: (slot: 'hero' | 'institutional', file: File) => {
    const form = new FormData()
    form.append('slot', slot)
    form.append('image', file)
    return api.post('/contabil/firm/public-site/images', form).then((r) => r.data as PublicSiteImageRef)
  },
}
