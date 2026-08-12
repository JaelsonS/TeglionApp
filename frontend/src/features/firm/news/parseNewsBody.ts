/** Marcador exacto suportado: ![](url) — sem HTML livre. */
const IMAGE_MARKER_RE = /!\[\]\((https?:\/\/[^)\s]+|firm\/[^)\s]+)\)/g

export type NewsBodyPart =
  | { type: 'text'; value: string }
  | { type: 'image'; src: string }

export function parseNewsBody(body: string | null | undefined): NewsBodyPart[] {
  const text = String(body || '')
  if (!text) return []
  const parts: NewsBodyPart[] = []
  let lastIndex = 0
  const re = new RegExp(IMAGE_MARKER_RE.source, 'g')
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'image', src: match[1] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return parts
}
