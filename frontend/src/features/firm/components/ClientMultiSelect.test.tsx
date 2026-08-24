/** @vitest-environment happy-dom */
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { ClientMultiSelect } from './ClientMultiSelect'
import type { Client } from '@/shared/types/clients'

afterEach(cleanup)

const CLIENTS: Client[] = [
  { _id: 'client-a', id: 'client-a', name: 'Cliente A', fullName: 'Cliente A Lda' } as Client,
  { _id: 'client-b', id: 'client-b', name: 'Cliente B', fullName: 'Cliente B Lda' } as Client,
  { _id: 'client-c', id: 'client-c', name: 'Cliente C', fullName: 'Cliente C Lda' } as Client,
]

function Harness() {
  const [value, setValue] = useState<string[]>([])
  return (
    <div>
      <div data-testid="selected">{value.join(',')}</div>
      <ClientMultiSelect clients={CLIENTS} value={value} onChange={setValue} />
    </div>
  )
}

describe('ClientMultiSelect', () => {
  it('adiciona clientes à seleção ao clicar nos resultados da busca, sem duplicar', () => {
    render(<Harness />)

    fireEvent.click(screen.getByText('Cliente A Lda'))
    expect(screen.getByTestId('selected').textContent).toBe('client-a')

    fireEvent.click(screen.getByText('Cliente B Lda'))
    expect(screen.getByTestId('selected').textContent).toBe('client-a,client-b')
  })

  it('remove um cliente da seleção ao clicar no × do chip, mantendo os outros', () => {
    render(<Harness />)

    fireEvent.click(screen.getByText('Cliente A Lda'))
    fireEvent.click(screen.getByText('Cliente B Lda'))
    expect(screen.getByTestId('selected').textContent).toBe('client-a,client-b')

    const removeButtons = screen.getAllByRole('button', { name: 'Remover cliente' })
    fireEvent.click(removeButtons[0])

    expect(screen.getByTestId('selected').textContent).toBe('client-b')
  })

  it('não lista de novo, na busca, um cliente que já foi selecionado (só sobra o chip)', () => {
    render(<Harness />)

    fireEvent.click(screen.getByText('Cliente A Lda'))
    // Só o chip do selecionado deve restar -- não o botão de resultado de busca.
    expect(screen.getAllByText('Cliente A Lda')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /Cliente A Lda/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Cliente B Lda/ })).toBeTruthy()
  })
})
