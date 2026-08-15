import type { FirmInquiryTag } from '@/infrastructure/api/contabil/inquiryTags'

export type FirmEntityTag = Pick<FirmInquiryTag, 'id' | 'name' | 'colorHex'>

export const SUGGESTED_TAG_COLORS = ['#0F2942', '#B45309', '#1B6B4A', '#9A3412', '#475569', '#854D0E']

export function tagTextColor(hex: string) {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return '#fff'
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#0F172A' : '#FFFFFF'
}
