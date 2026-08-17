import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { formatSlotTime, groupSlotsByDay, slotDayKey } from '@/features/public-intake/groupPublicSlots'

type Props = {
  slots: string[]
  loading?: boolean
  value: string
  onChange: (iso: string) => void
  timeZone?: string
}

export function PublicSlotCalendar({ slots, loading, value, onChange, timeZone = 'Europe/Lisbon' }: Props) {
  const groups = useMemo(() => groupSlotsByDay(slots, timeZone), [slots, timeZone])
  const [dayKey, setDayKey] = useState(() => (value ? slotDayKey(value, timeZone) : groups[0]?.dateKey || ''))

  useEffect(() => {
    if (value) {
      setDayKey(slotDayKey(value, timeZone))
      return
    }
    if (!groups.some((g) => g.dateKey === dayKey)) {
      setDayKey(groups[0]?.dateKey || '')
    }
  }, [value, timeZone, groups, dayKey])

  const selectedDay = groups.find((g) => g.dateKey === dayKey) || groups[0]

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        A carregar horários disponíveis…
      </p>
    )
  }

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem horários disponíveis de momento.</p>
  }

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {groups.map((group) => {
          const selected = group.dateKey === selectedDay?.dateKey
          return (
            <button
              key={group.dateKey}
              type="button"
              onClick={() => {
                setDayKey(group.dateKey)
                if (value && slotDayKey(value, timeZone) !== group.dateKey) onChange('')
              }}
              className={cn(
                'min-w-[4.75rem] shrink-0 rounded-xl border px-3 py-2 text-center text-sm transition-colors',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/40',
              )}
            >
              {group.label}
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {(selectedDay?.slots ?? []).map((iso) => {
          const selected = value === iso
          return (
            <Button
              key={iso}
              type="button"
              variant={selected ? 'default' : 'outline'}
              className="h-10 rounded-xl"
              onClick={() => onChange(iso)}
            >
              {formatSlotTime(iso, timeZone)}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
