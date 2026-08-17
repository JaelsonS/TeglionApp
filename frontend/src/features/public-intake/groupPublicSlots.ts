/** Agrupa slots ISO por dia civil no fuso do escritório (Lisboa por omissão). */

export type SlotDayGroup = {
  dateKey: string
  label: string
  slots: string[]
}

export function slotDayKey(iso: string, timeZone = 'Europe/Lisbon'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function formatSlotDayLabel(iso: string, timeZone = 'Europe/Lisbon'): string {
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso))
}

export function formatSlotTime(iso: string, timeZone = 'Europe/Lisbon'): string {
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function groupSlotsByDay(slots: string[], timeZone = 'Europe/Lisbon'): SlotDayGroup[] {
  const map = new Map<string, SlotDayGroup>()
  for (const iso of slots) {
    if (!iso) continue
    const dateKey = slotDayKey(iso, timeZone)
    const existing = map.get(dateKey)
    if (existing) {
      existing.slots.push(iso)
    } else {
      map.set(dateKey, { dateKey, label: formatSlotDayLabel(iso, timeZone), slots: [iso] })
    }
  }
  return [...map.values()]
}
