/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { PublicSiteLegalFooterLinks } from './PublicSiteLegalFooterLinks'

describe('PublicSiteLegalFooterLinks', () => {
  it('mostra links e diálogo quando há textos legais', async () => {
    const user = userEvent.setup()
    render(
      <PublicSiteLegalFooterLinks termsText="Termos do escritório." privacyText="Privacidade do escritório." />,
    )
    expect(screen.getByRole('button', { name: 'Termos de Utilização' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Política de Privacidade' }))
    expect(screen.getByRole('dialog').textContent).toContain('Privacidade do escritório.')
  })

  it('oculta-se sem conteúdo', () => {
    const { container } = render(<PublicSiteLegalFooterLinks termsText="" privacyText={null} />)
    expect(container.innerHTML).toBe('')
  })
})
