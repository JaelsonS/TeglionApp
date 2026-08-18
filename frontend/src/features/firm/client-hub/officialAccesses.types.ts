export type OfficialPortalKey =
  | 'AT_FINANCAS'
  | 'SEGURANCA_SOCIAL'
  | 'VIA_CTT'
  | 'IAPMEI'
  | 'RELATORIO_UNICO'
  | 'CUSTOM'

export type OfficialAccessItem = {
  id: string | null
  portalKey: OfficialPortalKey
  title: string
  shortTitle: string
  description: string
  url: string | null
  usernameLabel: string
  label: string | null
  username: string | null
  hasPassword: boolean
  updatedAt: string | null
}

export type OfficialAccessesResponse = {
  items: OfficialAccessItem[]
  security: {
    hasLocalPassword: boolean
    stepUpMethods: string[]
    mfaRequired: boolean
    revealTtlSeconds: number
  }
}

export type OfficialAccessRevealResponse = {
  accessId: string
  portalKey: OfficialPortalKey
  username: string | null
  revealedValue: string
  revealTtlSeconds: number
}
