export type TeamMemberRole = 'FIRM_OWNER' | 'FIRM_STAFF' | 'FIRM_CONSULTANT'

export type TeamDepartment = {
    id: string
    name: string
    code?: string | null
    color?: string | null
    isActive: boolean
    isDefault?: boolean
}

export type TeamMember = {
    id: string
    email: string
    fullName: string
    role: TeamMemberRole
    jobTitle?: string | null
    isActive: boolean
    departmentId?: string | null
    departmentName?: string | null
    inviteStatus?: 'PENDING' | 'ACCEPTED' | 'REVOKED' | string
    emailConfirmedAt?: string | null
    department?: TeamDepartment | null
}

export type TeamPermissionsView = {
    memberId: string
    role: TeamMemberRole
    rolePermissions: string[]
    overridePermissions: string[] | null
    effectivePermissions: string[]
    availablePermissions: string[]
}
