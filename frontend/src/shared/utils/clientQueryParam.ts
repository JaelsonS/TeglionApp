export const CLIENT_QUERY_KEY = 'clientId'

export function readClientIdFromSearch(search: URLSearchParams): string | null {
  const id = search.get(CLIENT_QUERY_KEY)
  return id?.trim() || null
}

export function withClientQuery(path: string, clientId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}${CLIENT_QUERY_KEY}=${encodeURIComponent(clientId)}`
}
