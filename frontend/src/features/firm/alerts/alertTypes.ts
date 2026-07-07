export type BroadcastAttachment = {
  url: string
  name?: string
  mimeType?: string
  storageKey?: string
  type?: 'image' | 'file'
}

export function isImageAttachment(a: BroadcastAttachment) {
  const mime = a.mimeType || ''
  return a.type === 'image' || mime.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(a.url || a.name || '')
}
