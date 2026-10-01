import { api } from '@/infrastructure/api'
import type { FirmPublicSiteBundle, PublicSiteConfig, PublicSiteImageRef } from '@/shared/types/firmPublicSite'

export type PublicSiteLogoZone = 'header' | 'hero' | 'shared'

export const firmPublicSiteApi = {
  get: () => api.get('/contabil/firm/public-site').then((r) => r.data as FirmPublicSiteBundle),

  saveDraft: (config: PublicSiteConfig) =>
    api
      .patch('/contabil/firm/public-site/draft', config)
      .then((r) => r.data as { draft: PublicSiteConfig; draftUpdatedAt: string }),

  publish: (options?: {
    legalPublishAcknowledgement?: { accepted: true; missingItems: string[] }
  }) =>
    api
      .post('/contabil/firm/public-site/publish', options?.legalPublishAcknowledgement
        ? { legalPublishAcknowledgement: options.legalPublishAcknowledgement }
        : undefined)
      .then((r) => r.data as { published: PublicSiteConfig; publishedAt: string }),

  regeneratePreviewToken: () =>
    api
      .post('/contabil/firm/public-site/preview-token')
      .then((r) => r.data as { previewToken: string; previewTokenExpiresAt: string }),

  uploadImage: (slot: 'hero' | 'institutional' | 'section', file: File, sectionKey?: string) => {
    const form = new FormData()
    form.append('slot', slot)
    form.append('image', file)
    if (sectionKey) form.append('sectionKey', sectionKey)
    return api.post('/contabil/firm/public-site/images', form).then((r) => r.data as PublicSiteImageRef)
  },

  uploadPublicLogo: (file: File, zone: PublicSiteLogoZone = 'shared') => {
    const form = new FormData()
    form.append('image', file)
    const path = zone === 'shared' ? '/contabil/firm/public-site/logo' : `/contabil/firm/public-site/logo/${zone}`
    return api.post(path, form).then(
      (r) =>
        r.data as {
          logoStorageKey: string
          logoUrl: string
          zone: PublicSiteLogoZone
          draft: PublicSiteConfig
          draftUpdatedAt: string
        },
    )
  },

  removePublicLogo: (zone: PublicSiteLogoZone = 'shared') => {
    const path = zone === 'shared' ? '/contabil/firm/public-site/logo' : `/contabil/firm/public-site/logo/${zone}`
    return api
      .delete(path)
      .then((r) => r.data as { draft: PublicSiteConfig; draftUpdatedAt: string; zone: PublicSiteLogoZone })
  },

  reset: () =>
    api.post('/contabil/firm/public-site/reset').then(
      (r) =>
        r.data as {
          draft: PublicSiteConfig
          published: null
          publishedAt: null
          draftUpdatedAt: string
          reset: true
        },
    ),
}
