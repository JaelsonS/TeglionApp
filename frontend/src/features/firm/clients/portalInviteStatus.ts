import type { Client } from '@/shared/types/clients'

export type PortalInviteUiStatus =
  | 'NO_INVITE'
  | 'INVITE_SENT'
  | 'INVITE_ACCEPTED'
  | 'ACCESS_ACTIVE'
  | 'ACCESS_REVOKED'

export type PortalInviteUi = {
  status: PortalInviteUiStatus
  label: string
  className: string
  /** Acção principal sugerida na lista (se aplicável). */
  primaryAction: 'send_invite' | 'resend_invite' | 'manage_access' | null
}

/**
 * Estado dinâmico de acesso ao portal — derivado de `portalAccessStatus` +
 * `lastLoginAt` (sem campo manual). Aceitar o convite activa a conta de imediato;
 * sem primeiro login mostra «Convite aceite»; com login mostra «Acesso activo».
 */
export function resolvePortalInviteUi(client: Pick<Client, 'portalAccessStatus' | 'lastLoginAt'>): PortalInviteUi {
  const status = client.portalAccessStatus || 'NO_ACCESS'
  if (status === 'REVOKED') {
    return {
      status: 'ACCESS_REVOKED',
      label: 'Acesso revogado',
      className: 'cb-pill cb-pill-gray',
      primaryAction: 'resend_invite',
    }
  }
  if (status === 'PENDING_INVITE') {
    return {
      status: 'INVITE_SENT',
      label: 'Convite enviado',
      className: 'cb-pill cb-pill-orange',
      primaryAction: 'resend_invite',
    }
  }
  if (status === 'ACTIVE') {
    if (client.lastLoginAt) {
      return {
        status: 'ACCESS_ACTIVE',
        label: 'Acesso activo',
        className: 'cb-pill cb-pill-green',
        primaryAction: 'manage_access',
      }
    }
    return {
      status: 'INVITE_ACCEPTED',
      label: 'Convite aceite',
      className: 'cb-pill cb-pill-green',
      primaryAction: 'manage_access',
    }
  }
  return {
    status: 'NO_INVITE',
    label: 'Convite não enviado',
    className: 'cb-pill cb-pill-gray',
    primaryAction: 'send_invite',
  }
}
