import { describe, expect, it } from 'vitest'

import { resolvePortalInviteUi } from './portalInviteStatus'

describe('resolvePortalInviteUi', () => {
  it('maps NO_ACCESS to convite não enviado', () => {
    const ui = resolvePortalInviteUi({ portalAccessStatus: 'NO_ACCESS' })
    expect(ui.status).toBe('NO_INVITE')
    expect(ui.label).toBe('Convite não enviado')
    expect(ui.primaryAction).toBe('send_invite')
  })

  it('maps PENDING_INVITE to convite enviado', () => {
    const ui = resolvePortalInviteUi({ portalAccessStatus: 'PENDING_INVITE' })
    expect(ui.status).toBe('INVITE_SENT')
    expect(ui.primaryAction).toBe('resend_invite')
  })

  it('maps ACTIVE without login to convite aceite', () => {
    const ui = resolvePortalInviteUi({ portalAccessStatus: 'ACTIVE', lastLoginAt: null })
    expect(ui.status).toBe('INVITE_ACCEPTED')
    expect(ui.label).toBe('Convite aceite')
  })

  it('maps ACTIVE with login to acesso activo', () => {
    const ui = resolvePortalInviteUi({
      portalAccessStatus: 'ACTIVE',
      lastLoginAt: '2026-01-01T10:00:00.000Z',
    })
    expect(ui.status).toBe('ACCESS_ACTIVE')
    expect(ui.label).toBe('Acesso activo')
  })

  it('maps REVOKED', () => {
    const ui = resolvePortalInviteUi({ portalAccessStatus: 'REVOKED' })
    expect(ui.status).toBe('ACCESS_REVOKED')
    expect(ui.primaryAction).toBe('resend_invite')
  })
})
