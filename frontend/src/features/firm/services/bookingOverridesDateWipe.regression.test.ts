/**
 * Regressão — preservação de dateOverrides no editor completo do serviço.
 *
 * TESTE A — caminho ServiceBookingAvailabilitySection / ServiceFullEditorSheet
 * TESTE B — caminho AgendaServiceHoursPanel (contraste, comportamento correcto)
 */
import { describe, expect, it } from 'vitest'

import type { BookingDaySchedule, FirmBookingSettings } from '@/shared/types/contabil'

import {
  bookingOverridesPayload,
  computeServiceBookingOverridesPatch,
  patchServiceBookingOverrides,
} from './serviceBookingAvailability'

const SPECIAL_DATE = '2026-09-20'
const SPECIAL_INTERVALS = [{ start: '10:00', end: '14:00' }] as const

const INITIAL_SCHEDULE: BookingDaySchedule = {
  1: [{ start: '09:00', end: '18:00' }],
  2: [{ start: '09:00', end: '18:00' }],
  3: [{ start: '09:00', end: '18:00' }],
  4: [{ start: '09:00', end: '18:00' }],
  5: [{ start: '09:00', end: '18:00' }],
}

const INITIAL_BOOKING_OVERRIDES: Partial<FirmBookingSettings> = {
  weekdays: [1, 2, 3, 4, 5],
  schedule: INITIAL_SCHEDULE,
  dateOverrides: {
    [SPECIAL_DATE]: [...SPECIAL_INTERVALS],
  },
}

const SCHEDULE_AFTER_WEEKLY_EDIT: BookingDaySchedule = {
  1: [{ start: '09:00', end: '18:00' }],
  2: [{ start: '09:00', end: '18:00' }],
  3: [{ start: '09:00', end: '18:00' }],
  4: [{ start: '09:00', end: '18:00' }],
}

function fullEditorAfterScheduleChange(
  current: Partial<FirmBookingSettings>,
  nextSchedule: BookingDaySchedule,
) {
  return patchServiceBookingOverrides(current, { schedule: nextSchedule }, INITIAL_SCHEDULE)
}

function agendaPanelAfterScheduleChange(
  current: {
    enabled: boolean
    schedule: BookingDaySchedule
    dateOverrides: NonNullable<FirmBookingSettings['dateOverrides']>
  },
  nextSchedule: BookingDaySchedule,
) {
  const draft = { ...current, schedule: nextSchedule }
  return bookingOverridesPayload(draft.enabled, draft.schedule, draft.dateOverrides)
}

describe('dateOverrides preservation — editor completo (ServiceFullEditorSheet)', () => {
  it('estado inicial: dateOverrides["2026-09-20"] existe', () => {
    expect(INITIAL_BOOKING_OVERRIDES.dateOverrides?.[SPECIAL_DATE]).toEqual([...SPECIAL_INTERVALS])
  })

  it('alterar horário semanal preserva dateOverrides no estado local', () => {
    const afterScheduleChange = fullEditorAfterScheduleChange(
      INITIAL_BOOKING_OVERRIDES,
      SCHEDULE_AFTER_WEEKLY_EDIT,
    )
    expect(afterScheduleChange?.dateOverrides?.[SPECIAL_DATE]).toEqual([...SPECIAL_INTERVALS])
  })

  it('payload de save inclui dateOverrides', () => {
    const reactStateAfterUi = fullEditorAfterScheduleChange(
      INITIAL_BOOKING_OVERRIDES,
      SCHEDULE_AFTER_WEEKLY_EDIT,
    )
    const savePayload = computeServiceBookingOverridesPatch(reactStateAfterUi)
    expect(savePayload?.schedule).toEqual(SCHEDULE_AFTER_WEEKLY_EDIT)
    expect(savePayload?.dateOverrides?.[SPECIAL_DATE]).toEqual([...SPECIAL_INTERVALS])
  })

  it('persistência simulada mantém a excepção (coluna substituída com objecto completo)', () => {
    const reactStateAfterUi = fullEditorAfterScheduleChange(
      INITIAL_BOOKING_OVERRIDES,
      SCHEDULE_AFTER_WEEKLY_EDIT,
    )
    const savePayload = computeServiceBookingOverridesPatch(reactStateAfterUi)
    expect(savePayload?.dateOverrides?.[SPECIAL_DATE]).toEqual([...SPECIAL_INTERVALS])
  })

  it('adicionar dia especial preserva o horário semanal', () => {
    const withSpecialDay = patchServiceBookingOverrides(
      { weekdays: [1], schedule: { 1: [{ start: '09:00', end: '12:00' }] } },
      { dateOverrides: { '2026-10-01': [{ start: '10:00', end: '14:00' }] } },
      {},
    )
    expect(withSpecialDay?.schedule?.[1]).toEqual([{ start: '09:00', end: '12:00' }])
    expect(withSpecialDay?.dateOverrides?.['2026-10-01']).toEqual([{ start: '10:00', end: '14:00' }])
  })

  it('dia especial fechado persiste como array vazio', () => {
    const closed = patchServiceBookingOverrides(
      INITIAL_BOOKING_OVERRIDES,
      { dateOverrides: { ...INITIAL_BOOKING_OVERRIDES.dateOverrides, '2026-09-21': [] } },
      INITIAL_SCHEDULE,
    )
    expect(closed?.dateOverrides?.['2026-09-21']).toEqual([])
    expect(closed?.dateOverrides?.[SPECIAL_DATE]).toEqual([...SPECIAL_INTERVALS])
  })

  it('remover dia especial não apaga os restantes', () => {
    const nextDates = { ...INITIAL_BOOKING_OVERRIDES.dateOverrides, '2026-09-21': [{ start: '11:00', end: '13:00' }] }
    const withTwo = patchServiceBookingOverrides(
      INITIAL_BOOKING_OVERRIDES,
      { dateOverrides: nextDates },
      INITIAL_SCHEDULE,
    )
    const removed = patchServiceBookingOverrides(
      withTwo,
      { dateOverrides: { [SPECIAL_DATE]: [...SPECIAL_INTERVALS] } },
      INITIAL_SCHEDULE,
    )
    expect(removed?.dateOverrides?.[SPECIAL_DATE]).toEqual([...SPECIAL_INTERVALS])
    expect(removed?.dateOverrides?.['2026-09-21']).toBeUndefined()
  })
})

describe('dateOverrides preservation — AgendaServiceHoursPanel (contraste)', () => {
  it('alterar schedule e guardar preserva dateOverrides["2026-09-20"]', () => {
    const draftBefore = {
      enabled: true,
      schedule: INITIAL_SCHEDULE,
      dateOverrides: {
        [SPECIAL_DATE]: [...SPECIAL_INTERVALS],
      },
    }

    const savePayload = agendaPanelAfterScheduleChange(draftBefore, SCHEDULE_AFTER_WEEKLY_EDIT)

    expect(savePayload?.schedule).toEqual(SCHEDULE_AFTER_WEEKLY_EDIT)
    expect(savePayload?.dateOverrides?.[SPECIAL_DATE]).toEqual([...SPECIAL_INTERVALS])
    expect(savePayload?.weekdays).toEqual([1, 2, 3, 4])
  })
})
