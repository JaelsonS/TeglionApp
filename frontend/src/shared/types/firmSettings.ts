export type FirmDbRole = 'FIRM_OWNER' | 'FIRM_STAFF' | 'FIRM_CONSULTANT'

export type FirmSettingsContact = {
  email: string | null
  phone: string | null
  taxId: string | null
  address: string | null
}

export type FirmSettingsTeamMember = {
  id: string
  email: string
  fullName: string
  role: FirmDbRole
  roleLabel: string
  jobTitle?: string | null
  departmentId?: string | null
  departmentName?: string | null
  isActive: boolean
  isCurrentUser: boolean
  isOwner: boolean
}

export type FirmSettingsCapabilities = {
  canEditFirm: boolean
  canManageTeam: boolean
  canCloseAccount: boolean
  canEditOwnProfile: boolean
}

export type FirmSettingsBundle = {
  firm: {
    id: string
    name: string
    slug?: string
    status?: string
    trialEndsAt?: string | null
    billingPlan?: string | null
    branding?: { logoUrl?: string | null }
  }
  logoUrl?: string | null
  contact: FirmSettingsContact
  actor: {
    id: string
    email: string
    fullName: string
    firmRole: FirmDbRole
    firmRoleLabel: string
    jobTitle?: string | null
    departmentId?: string | null
    departmentName?: string | null
    isOwner: boolean
  }
  team: FirmSettingsTeamMember[]
  capabilities: FirmSettingsCapabilities
}

export type PatchFirmSettingsPayload = {
  name?: string
  contactEmail?: string | null
  contactPhone?: string | null
  taxId?: string | null
  address?: string | null
}

export type PatchFirmProfilePayload = {
  fullName?: string
  email?: string
}
