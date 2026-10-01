/** Remove comentários HTML de seeds de demo — não mostrar na página pública. */
export function stripDemoContentMarkers(raw: string | null | undefined): string {
  let s = String(raw ?? '')
  s = s.replace(/<!--[\s\S]*?-->/g, '')
  s = s.replace(/\s{2,}/g, ' ').trim()
  return s
}
