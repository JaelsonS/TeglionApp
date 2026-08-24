/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AuthContext } from '@/shared/contexts/AuthContext'
import type { AuthContextValue, AuthUser } from '@/shared/types/auth'
import { useClientDocumentRequests } from './useClientDocumentRequests'

// Regressão do ROADMAP item 1.2: quatro componentes do portal do cliente (dashboard,
// agenda, badges de navegação, painel de pedidos) chamavam clientPortalContabilApi.
// listDocumentRequests() de forma independente, cada um com sua própria queryKey — 4
// GET /client-portal/me/contabil/document-requests na mesma sessão. Este teste prova que,
// com o hook compartilhado, dois consumidores montados ao mesmo tempo geram uma única
// requisição de rede (mesma queryKey → mesma entrada de cache no TanStack Query).

const listDocumentRequestsMock = vi.fn(async () => ({ items: [{ id: 'req-1', status: 'pending' }] }))

vi.mock('@/infrastructure/api', () => ({
  clientPortalContabilApi: {
    listDocumentRequests: () => listDocumentRequestsMock(),
  },
}))

function Consumer({ label }: { label: string }) {
  const query = useClientDocumentRequests()
  return <div data-testid={label}>{query.data?.items.length ?? 'loading'}</div>
}

function renderWithProviders(children: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const authValue = {
    user: { id: 'client-1', clientId: 'client-1' } as AuthUser,
    isAuthenticated: true,
    isBootstrapping: false,
  } as AuthContextValue

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('useClientDocumentRequests', () => {
  it('dois consumidores com o mesmo clientId partilham uma única requisição de rede', async () => {
    listDocumentRequestsMock.mockClear()

    renderWithProviders(
      <>
        <Consumer label="a" />
        <Consumer label="b" />
      </>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('a').textContent).toBe('1')
      expect(screen.getByTestId('b').textContent).toBe('1')
    })

    expect(listDocumentRequestsMock).toHaveBeenCalledTimes(1)
  })
})
