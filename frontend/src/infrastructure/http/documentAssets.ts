import { isContabilMode } from '@/shared/config/productMode'

import { api, getApiBaseUrlResolved, toPublicAssetUrl } from './apiClient'

export function documentPreviewUrl(documentId: string): string {
  return `${getApiBaseUrlResolved()}/contabil/documents/${encodeURIComponent(documentId)}/preview`
}

function normalizeLegalPublicAssetPathForApi(value: string): string | null {
  if (!value) return null

  if (value.startsWith('/api/uploads/')) {
    return value.replace(/^\/api\//, '/')
  }

  if (value.startsWith('/api/')) {
    return value.replace(/^\/api\//, '/')
  }

  if (value.startsWith('/uploads/')) {
    return value
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value)
      if (parsed.pathname.startsWith('/api/uploads/')) {
        return `${parsed.pathname.replace(/^\/api\//, '/')}${parsed.search || ''}`
      }
      if (parsed.pathname.startsWith('/uploads/')) {
        return `${parsed.pathname}${parsed.search || ''}`
      }
    } catch {
      return null
    }
  }

  return null
}

async function fetchExternalPublicBinary(url: string): Promise<Blob> {
  const response = await fetch(url, { credentials: 'omit', mode: 'cors' })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.blob()
}

async function resolvePublicPdfBlob(resolvedUrl: string): Promise<Blob> {
  const authenticatedPath = normalizeLegalPublicAssetPathForApi(resolvedUrl)
  if (authenticatedPath) {
    const response = await api.get(authenticatedPath, { responseType: 'blob' as const })
    return response.data as Blob
  }
  if (/^https?:\/\//i.test(resolvedUrl)) {
    return fetchExternalPublicBinary(resolvedUrl)
  }
  const response = await api.get(resolvedUrl, { responseType: 'blob' as const })
  return response.data as Blob
}

export function resolveDocumentPreviewPath(docId: string, context: 'firm' | 'client' = 'firm'): string {
  return context === 'client'
    ? `/client-portal/me/contabil/documents/${encodeURIComponent(docId)}/preview`
    : `/contabil/documents/${encodeURIComponent(docId)}/preview`
}

export async function fetchDocumentPreviewUrl(
  docId: string,
  context: 'firm' | 'client' = 'firm',
): Promise<string | null> {
  const path = resolveDocumentPreviewPath(docId, context)
  const res = await api.get(path, { responseType: 'blob' })
  const blob = res.data as Blob
  if (!blob || blob.size === 0) return null
  return URL.createObjectURL(blob)
}

export async function fetchDocumentBlobUrl(docId: string, context: 'firm' | 'client' = 'firm'): Promise<string> {
  const path = resolveDocumentDownloadUrl(docId, null, context)
  const res = await api.get(path, { responseType: 'blob' })
  const blob = res.data as Blob
  return URL.createObjectURL(blob)
}

export function resolveDocumentDownloadUrl(
  docId: string,
  downloadUrl?: string | null,
  context: 'firm' | 'client' = 'firm',
): string {
  if (downloadUrl && /^https?:\/\//i.test(downloadUrl)) return downloadUrl
  if (isContabilMode()) {
    return context === 'client'
      ? `/client-portal/me/contabil/documents/${encodeURIComponent(docId)}/download`
      : `/contabil/documents/${encodeURIComponent(docId)}/download`
  }
  if (downloadUrl && /\/uploads\//i.test(downloadUrl)) {
    return `/documents/${docId}/download`
  }
  if (downloadUrl) return downloadUrl
  return `/documents/${docId}/download`
}

function normalizeDocumentUrl(url: string): string {
  if (url.startsWith('/api/')) {
    return url.replace(/^\/api\//, '/')
  }
  return url
}

export async function openDocumentBlob(url: string, filename?: string) {
  const normalized = normalizeDocumentUrl(url)
  try {
    const response = await api.get(normalized, { responseType: 'blob' as const })
    const blob = response.data as Blob
    const objectUrl = URL.createObjectURL(blob)
    const win = window.open(objectUrl, '_blank', 'noopener')

    if (!win) {
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      if (filename) anchor.download = filename
      anchor.rel = 'noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
  } catch {
    throw new Error('Não foi possível abrir o documento. Tente novamente.')
  }
}

export async function openPublicAssetPdf(pathOrUrl: string, filename?: string) {
  const resolvedUrl = /^https?:\/\//i.test(pathOrUrl)
    ? pathOrUrl
    : toPublicAssetUrl(pathOrUrl) || pathOrUrl

  try {
    const blob = await resolvePublicPdfBlob(resolvedUrl)
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    if (filename) anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
  } catch {
    const fallbackWindow = window.open(resolvedUrl, '_blank', 'noopener,noreferrer')
    if (fallbackWindow) return

    const anchor = document.createElement('a')
    anchor.href = resolvedUrl
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    if (filename) anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }
}

export async function getPublicAssetPdfObjectUrl(pathOrUrl: string): Promise<string> {
  const resolvedUrl = /^https?:\/\//i.test(pathOrUrl)
    ? pathOrUrl
    : toPublicAssetUrl(pathOrUrl) || pathOrUrl

  const blob = await resolvePublicPdfBlob(resolvedUrl)
  return URL.createObjectURL(blob)
}

export async function openPublicAssetPdfPreview(pathOrUrl: string): Promise<void> {
  const objectUrl = await getPublicAssetPdfObjectUrl(pathOrUrl)
  window.location.assign(objectUrl)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000)
}
