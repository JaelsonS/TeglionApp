/** Remove parâmetro de recuperação de chunk da URL (evita estado partido no iPhone). */
export function cleanRecoverQueryFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('__chunk_recover')) return
    url.searchParams.delete('__chunk_recover')
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState(window.history.state, '', next)
  } catch {
    /* ignore */
  }
}
