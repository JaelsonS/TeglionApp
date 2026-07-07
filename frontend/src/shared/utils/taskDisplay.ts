import { looksEncrypted, safeDisplayText } from '@/shared/utils/safeDisplayText'

/** Texto amigável para tarefas — oculta notas internas do sistema. */
export function formatTaskDueDate(iso?: string | null): string {
  if (!iso) return '—'
  const raw = String(iso)
  const dateOnly = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10)
  const [y, m, d] = dateOnly.split('-').map(Number)
  if (y && m && d) {
    return new Date(y, m - 1, d).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const HIDDEN_DESCRIPTION_PATTERNS = [
  /^\[Cliente\]/i,
  /Marcada como concluída pelo cliente/i,
  /Documento enviado pelo portal/i,
  /^enviar notas$/i,
  /^enviar documentos$/i,
  /Carregue os documentos solicitados pelo escritório/i,
  /^Consulte a guia e documentos no portal\.?$/i,
]

export function sanitizeTaskDescription(description?: string | null): string | null {
  if (!description?.trim()) return null
  if (looksEncrypted(description)) return null
  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !HIDDEN_DESCRIPTION_PATTERNS.some((re) => re.test(l)))
  if (!lines.length) return null
  return lines.join('\n')
}

export function formatTaskTitle(title?: string | null): string {
  if (!title?.trim()) return 'Tarefa'
  const plain = safeDisplayText(title, 'Tarefa')
  return plain.replace(/^Enviar documentos:\s*/i, '').trim() || plain
}
