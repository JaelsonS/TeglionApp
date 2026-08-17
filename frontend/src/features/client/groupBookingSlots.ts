export type BookingSlotDayGroup = {
  dateKey: string
  heading: string
  slots: string[]
}

function formatDateKey(iso: string, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function formatDayHeading(iso: string, timezone: string) {
  const raw = new Intl.DateTimeFormat('pt-PT', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/** Agrupa horários ISO por dia civil no fuso do escritório. */
export function groupBookingSlots(slots: string[], timezone = 'Europe/Lisbon'): BookingSlotDayGroup[] {
  const byDay = new Map<string, string[]>()
  for (const iso of slots) {
    if (!iso) continue
    const dateKey = formatDateKey(iso, timezone)
    const list = byDay.get(dateKey)
    if (list) list.push(iso)
    else byDay.set(dateKey, [iso])
  }
  return [...byDay.entries()].map(([, daySlots]) => ({
    dateKey: formatDateKey(daySlots[0], timezone),
    heading: formatDayHeading(daySlots[0], timezone),
    slots: daySlots,
  }))
}

export function formatSlotTime(iso: string, timezone = 'Europe/Lisbon') {
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
