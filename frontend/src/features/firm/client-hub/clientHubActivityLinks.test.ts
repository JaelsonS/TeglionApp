import { describe, expect, it } from 'vitest'

import type { ClientHubTimelineItem } from '@/infrastructure/api/contabil/types'
import { resolveActivityNav } from '@/features/firm/client-hub/clientHubActivityLinks'

const base = (partial: Partial<ClientHubTimelineItem> & Pick<ClientHubTimelineItem, 'id' | 'kind' | 'at' | 'title'>): ClientHubTimelineItem => ({
  ...partial,
})

describe('resolveActivityNav', () => {
  const clientId = 'client-1'

  it('abre documento com doc + clientId', () => {
    const nav = resolveActivityNav(
      clientId,
      base({
        id: 'document-doc-9',
        kind: 'document',
        at: '2026-01-01T00:00:00Z',
        title: 'IVA',
        entityId: 'doc-9',
      }),
    )
    expect(nav).toEqual({
      type: 'href',
      href: '/app/firm/documents/files?doc=doc-9&clientId=client-1',
    })
  })

  it('abre tarefa no workspace manual', () => {
    const nav = resolveActivityNav(
      clientId,
      base({
        id: 'task-t1',
        kind: 'task',
        at: '2026-01-01T00:00:00Z',
        title: 'Pedir recibos',
        entityId: 't1',
      }),
    )
    expect(nav).toEqual({
      type: 'href',
      href: '/app/firm/tasks/manual?task=t1&clientId=client-1',
    })
  })

  it('abre obrigação com ob=', () => {
    const nav = resolveActivityNav(
      clientId,
      base({
        id: 'obligation-o1',
        kind: 'obligation',
        at: '2026-01-01T00:00:00Z',
        title: 'IRC',
        entityId: 'o1',
      }),
    )
    expect(nav).toEqual({
      type: 'href',
      href: '/app/firm/tasks/obligations?ob=o1&clientId=client-1',
    })
  })

  it('abre mensagens com client=', () => {
    const nav = resolveActivityNav(
      clientId,
      base({
        id: 'message-m1',
        kind: 'message',
        at: '2026-01-01T00:00:00Z',
        title: 'Mensagem',
        entityId: 'm1',
      }),
    )
    expect(nav).toEqual({
      type: 'href',
      href: '/app/firm/messages?client=client-1&message=m1',
    })
  })

  it('perfil fica no hub', () => {
    expect(
      resolveActivityNav(
        clientId,
        base({
          id: 'activity-p1',
          kind: 'profile',
          at: '2026-01-01T00:00:00Z',
          title: 'Dados actualizados',
        }),
      ),
    ).toEqual({ type: 'profile' })
  })

  it('sem destino quando não há entityId', () => {
    expect(
      resolveActivityNav(
        clientId,
        base({
          id: 'activity-x',
          kind: 'activity',
          at: '2026-01-01T00:00:00Z',
          title: 'Evento',
        }),
      ),
    ).toBeNull()
  })

  it('extrai entityId do id prefixado', () => {
    const nav = resolveActivityNav(
      clientId,
      base({
        id: 'document-abc-123',
        kind: 'document',
        at: '2026-01-01T00:00:00Z',
        title: 'Doc',
      }),
    )
    expect(nav).toEqual({
      type: 'href',
      href: '/app/firm/documents/files?doc=abc-123&clientId=client-1',
    })
  })
})
