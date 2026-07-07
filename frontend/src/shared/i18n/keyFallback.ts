export function humanizeI18nKey(key: string) {
  const leaf = String(key || '')
    .split('.')
    .filter(Boolean)
    .pop() || String(key || '')

  const normalized = leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!normalized) return key
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function isRawI18nKey(value: string, key: string) {
  const normalizedValue = String(value || '').trim()
  const normalizedKey = String(key || '').trim()
  if (!normalizedValue || !normalizedKey) return false

  return normalizedValue === normalizedKey
    || normalizedValue === normalizedKey.split('.').pop()
}
