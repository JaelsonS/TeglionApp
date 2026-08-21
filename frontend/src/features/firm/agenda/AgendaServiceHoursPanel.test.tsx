/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AccountingService, BookingDaySchedule } from '@/shared/types/contabil'

import { AgendaServiceHoursPanel } from './AgendaServiceHoursPanel'

const FIRM_SCHEDULE: BookingDaySchedule = {
  1: [{ start: '09:00', end: '17:00' }],
  2: [{ start: '09:00', end: '17:00' }],
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
})
