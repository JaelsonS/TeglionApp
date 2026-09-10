/**
 * Gera URL segura para abrir o endereço no Google Maps (nova aba).
 * Preferência: URL Maps explícita → coordenadas → pesquisa pelo texto do endereço.
 */
export function buildGoogleMapsUrl(input: {
  address?: string | null
  mapsUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}): string | null {
  const explicit = String(input.mapsUrl || '').trim()
  if (explicit && /^https:\/\/(www\.)?google\.[^/]+\/maps/i.test(explicit)) {
    return explicit
  }
  if (explicit && /^https:\/\/maps\.app\.goo\.gl\//i.test(explicit)) {
    return explicit
  }
  if (explicit && /^https:\/\/goo\.gl\/maps\//i.test(explicit)) {
    return explicit
  }

  const lat = input.latitude
  const lng = input.longitude
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
  }

  const address = String(input.address || '').trim()
  if (!address) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
