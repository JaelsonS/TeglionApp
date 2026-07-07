import { useCallback, useEffect, useState } from 'react'

import { api } from '@/infrastructure/api'

type FiscalCalendarNotesResponse = {
  notes?: Record<string, string>
}

export function useFiscalCalendarNotes(firmKey: string | null | undefined) {
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!firmKey) return
    try {
      const res = await api.get<FiscalCalendarNotesResponse>('/contabil/fiscal-calendar/notes')
      setNotes(res.data?.notes ?? {})
    } catch {
      // Falha ao carregar notas: mantém vazio (a UI ainda pode funcionar).
      setNotes({})
    }
  }, [firmKey])

  useEffect(() => {
    void load()
  }, [load])

  const saveNote = useCallback(
    async (itemId: string, text: string) => {
      if (!firmKey) return
      const trimmed = text.trim()

      // Optimistic UI: a nota aparece imediatamente.
      setNotes((prev) => {
        const next = { ...prev }
        if (trimmed) next[itemId] = trimmed
        else delete next[itemId]
        return next
      })

      try {
        await api.patch('/contabil/fiscal-calendar/notes', {
          itemId,
          text: trimmed || null,
        })
      } catch {
        // Em caso de falha, recarrega para re-sincronizar com o backend.
        await load()
      }
    },
    [firmKey, load],
  )

  const getNote = useCallback((itemId: string) => notes[itemId] ?? '', [notes])

  return { notes, saveNote, getNote }
}
