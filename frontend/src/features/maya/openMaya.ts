/**
 * Abertura contextual da Maya (v1 estática) sem acoplar páginas ao Sheet.
 * Sem LLM / sem dados de negócio.
 */

export const MAYA_OPEN_EVENT = 'teglion:maya-open'

export type MayaOpenDetail = {
  intentId?: string | null
}

export function openMaya(intentId?: string | null) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<MayaOpenDetail>(MAYA_OPEN_EVENT, {
      detail: { intentId: intentId || null },
    }),
  )
}
