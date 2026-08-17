/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AGENCY } from '@/shared/config/agency'
import { BRAND } from '@/shared/config/brand'

import { TeglionPublicCredit } from './TeglionPublicCredit'

describe('TeglionPublicCredit', () => {
  it('shows Teglion credit and AfDigital company link', () => {
    render(<TeglionPublicCredit />)

    const teglion = screen.getByRole('link', { name: `Página criada com ${BRAND.name}` })
    expect(teglion.getAttribute('href')).toBe(BRAND.url)
    expect(teglion.getAttribute('target')).toBe('_blank')

    const agency = screen.getByRole('link', { name: `Website da ${AGENCY.displayName}` })
    expect(agency.textContent).toBe(AGENCY.displayName)
    expect(agency.getAttribute('href')).toBe(AGENCY.url)
    expect(agency.getAttribute('target')).toBe('_blank')
    expect(agency.textContent).not.toMatch(/Página criada com/i)
  })

  it('hides both lines when branding is off', () => {
    const { container } = render(<TeglionPublicCredit visible={false} />)
    expect(container.innerHTML).toBe('')
  })
})
