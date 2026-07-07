export function formatNif(nif?: string | null): string {
  if (!nif) return '—'
  const d = String(nif).replace(/\D/g, '')
  if (d.length !== 9) return nif
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}
