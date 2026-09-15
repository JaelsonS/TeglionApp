/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AccountingService, BookingDaySchedule } from '@/shared/types/contabil'

import { AgendaServiceHoursPanel } from './AgendaServiceHoursPanel'

const patchService = vi.fn()

vi.mock('@/infrastructure/api', () => ({
  contabilAccountingServicesApi: {
    patch: (...args: unknown[]) => patchService(...args),
  },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const FIRM_SCHEDULE: BookingDaySchedule = {
  1: [{ start: '09:00', end: '17:00' }],
  2: [{ start: '09:00', end: '17:00' }],
  3: [{ start: '09:00', end: '17:00' }],
  4: [{ start: '09:00', end: '17:00' }],
  5: [{ start: '09:00', end: '17:00' }],
}

function renderPanel(services: AccountingService[], loading = false) {
  return render(
    <MemoryRouter>
      <AgendaServiceHoursPanel
        services={services}
        servicesLoading={loading}
        onReload={vi.fn()}
        firmSchedule={FIRM_SCHEDULE}
      />
    </MemoryRouter>,
  )
}

describe('AgendaServiceHoursPanel', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    patchService.mockReset()
    patchService.mockResolvedValue({})
  })

  it('shows loading', () => {
    renderPanel([], true)
    expect(screen.getByTestId('agenda-service-hours-loading')).toBeTruthy()
  })

  it('shows empty state when no bookable services exist', () => {
    renderPanel([
      {
        id: 'a',
        name: 'IRS papel',
        durationMinutes: 30,
        priceCents: 0,
        requiresBooking: false,
        isActive: true,
      },
    ])
    expect(screen.getByTestId('agenda-service-hours-empty')).toBeTruthy()
    expect(screen.queryByText('IRS papel')).toBeNull()
    expect(screen.getByTestId('agenda-nonbookable-hint')).toBeTruthy()
    expect(screen.getByText(/1 serviço do catálogo não exige marcação/)).toBeTruthy()
  })

  it('distinguishes inherited vs custom hours', () => {
    renderPanel([
      {
        id: 'a',
        name: 'Consultoria',
        durationMinutes: 60,
        priceCents: 0,
        requiresBooking: true,
        isActive: true,
        bookingOverrides: { weekdays: [1], schedule: { 1: [{ start: '09:00', end: '12:00' }] } },
      },
      {
        id: 'b',
        name: 'Acompanhamento',
        durationMinutes: 45,
        priceCents: 0,
        requiresBooking: true,
        isActive: true,
        bookingOverrides: null,
      },
      {
        id: 'c',
        name: 'IRS papel',
        durationMinutes: 30,
        priceCents: 0,
        requiresBooking: false,
        isActive: true,
      },
    ])
    expect(screen.getByText('Consultoria')).toBeTruthy()
    expect(screen.getByText('Acompanhamento')).toBeTruthy()
    expect(screen.getAllByText(/Horário próprio/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Horário geral/i).length).toBeGreaterThan(0)
    expect(screen.queryByText('IRS papel')).toBeNull()
    expect(screen.getByText(/1 serviço do catálogo não exige marcação/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Personalizar' })).toBeTruthy()
  })

  it('alterar schedule e Guardar preserva dateOverrides no PATCH (contraste)', async () => {
    const user = userEvent.setup()
    const service: AccountingService = {
      id: 'svc-consultoria',
      name: 'Consultoria Fiscal',
      durationMinutes: 60,
      priceCents: 0,
      requiresBooking: true,
      isActive: true,
      bookingOverrides: {
        weekdays: [1, 2, 3, 4, 5],
        schedule: {
          1: [{ start: '09:00', end: '18:00' }],
          2: [{ start: '09:00', end: '18:00' }],
          3: [{ start: '09:00', end: '18:00' }],
          4: [{ start: '09:00', end: '18:00' }],
          5: [{ start: '09:00', end: '18:00' }],
        },
        dateOverrides: { '2026-09-20': [{ start: '10:00', end: '14:00' }] },
      },
    }

    renderPanel([service])
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.click(screen.getByLabelText(/Sexta disponível/i))
    await user.click(screen.getByRole('button', { name: /^Guardar$/i }))

    await waitFor(() => expect(patchService).toHaveBeenCalled())
    const [, payload] = patchService.mock.calls.at(-1) as [
      string,
      { bookingOverrides: { weekdays: number[]; dateOverrides?: Record<string, unknown> } },
    ]
    expect(payload.bookingOverrides.weekdays).not.toContain(5)
    expect(payload.bookingOverrides.dateOverrides?.['2026-09-20']).toEqual([
      { start: '10:00', end: '14:00' },
    ])
  })
})
