/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FirmBookingSettings } from '@/shared/types/contabil'

import { ServiceBookingAvailabilitySection } from './ServiceBookingAvailabilitySection'

const getBookingSettings = vi.fn()

vi.mock('@/infrastructure/api', () => ({
  contabilConsultationsApi: {
    getBookingSettings: (...args: unknown[]) => getBookingSettings(...args),
  },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const FIRM_BOOKING: FirmBookingSettings = {
  slotMinutes: 30,
  horizonDays: 14,
  leadTimeHours: 2,
  weekdays: [1, 2, 3, 4, 5],
  dayStart: '09:00',
  dayEnd: '18:00',
  timezone: 'Europe/Lisbon',
  schedule: {
    1: [
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '18:00' },
    ],
    2: [{ start: '09:00', end: '18:00' }],
    3: [{ start: '09:00', end: '18:00' }],
    4: [{ start: '09:00', end: '18:00' }],
    5: [{ start: '09:00', end: '18:00' }],
  },
}

describe('ServiceBookingAvailabilitySection', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    getBookingSettings.mockReset()
    getBookingSettings.mockResolvedValue({ booking: FIRM_BOOKING })
  })

  it('shows the inactive hint when the service does not require booking', () => {
    render(
      <ServiceBookingAvailabilitySection
        requiresBooking={false}
        durationMinutes={60}
        value={null}
        onChange={() => {}}
      />,
    )
    expect(screen.getByTestId('service-booking-availability-inactive')).toBeTruthy()
    expect(screen.queryByText('Personalizar horários deste serviço')).toBeNull()
  })

  it('starts inherited and seeds from the real firm schedule when enabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ServiceBookingAvailabilitySection
        requiresBooking
        durationMinutes={90}
        value={null}
        onChange={onChange}
      />,
    )

    expect(await screen.findByText(/utiliza o horário geral do escritório/i)).toBeTruthy()
    await waitFor(() => expect(getBookingSettings).toHaveBeenCalled())

    await user.click(screen.getByText('Personalizar horários deste serviço'))

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const payload = onChange.mock.calls.at(-1)?.[0] as { schedule: Record<number, unknown>; weekdays: number[] }
    expect(payload.weekdays).toEqual([1, 2, 3, 4, 5])
    expect(payload.schedule[1]).toEqual([
      { start: '09:00', end: '13:00' },
      { start: '14:00', end: '18:00' },
    ])
  })

  it('loads an existing custom configuration', async () => {
    render(
      <ServiceBookingAvailabilitySection
        requiresBooking
        durationMinutes={60}
        value={{
          weekdays: [1],
          schedule: { 1: [{ start: '09:00', end: '12:00' }] },
        }}
        onChange={() => {}}
      />,
    )
    expect(await screen.findByLabelText(/Segunda disponível/i)).toBeTruthy()
    expect(screen.getByLabelText(/Terça indisponível/i)).toBeTruthy()
  })

  it('disabling customization sends null', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ServiceBookingAvailabilitySection
        requiresBooking
        durationMinutes={60}
        value={{ weekdays: [1], schedule: { 1: [{ start: '09:00', end: '12:00' }] } }}
        onChange={onChange}
      />,
    )
    await user.click(screen.getByText('Personalizar horários deste serviço'))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('shows an API error without enabling hardcoded hours', async () => {
    getBookingSettings.mockRejectedValueOnce(new Error('rede indisponível'))
    render(
      <ServiceBookingAvailabilitySection
        requiresBooking
        durationMinutes={60}
        value={null}
        onChange={() => {}}
      />,
    )
    expect(await screen.findByTestId('service-booking-availability-error')).toBeTruthy()
    expect(screen.queryByLabelText(/Segunda/)).toBeNull()
  })

  it('allows closing a day and adding a second interval', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ServiceBookingAvailabilitySection
        requiresBooking
        durationMinutes={60}
        value={{
          weekdays: [1, 2],
          schedule: {
            1: [{ start: '09:00', end: '12:00' }],
            2: [{ start: '09:00', end: '12:00' }],
          },
        }}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByLabelText(/Terça disponível/i))
    const afterClose = onChange.mock.calls.at(-1)?.[0] as { weekdays: number[]; schedule: Record<string, unknown> }
    expect(afterClose.weekdays).toEqual([1])
    expect(afterClose.schedule[2]).toBeUndefined()

    await user.click(screen.getByLabelText(/Adicionar intervalo em Segunda/i))
    const afterAdd = onChange.mock.calls.at(-1)?.[0] as {
      schedule: Record<number, Array<{ start: string; end: string }>>
    }
    expect(afterAdd.schedule[1]).toHaveLength(2)
  })

  it('shows a loading state while the firm schedule is fetched', async () => {
    let resolveSettings: (value: unknown) => void = () => {}
    getBookingSettings.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSettings = resolve
      }),
    )
    render(
      <ServiceBookingAvailabilitySection
        requiresBooking
        durationMinutes={60}
        value={null}
        onChange={() => {}}
      />,
    )
    expect(screen.getByTestId('service-booking-availability-loading')).toBeTruthy()
    resolveSettings({ booking: FIRM_BOOKING })
    await waitFor(() => expect(screen.queryByTestId('service-booking-availability-loading')).toBeNull())
  })
})
