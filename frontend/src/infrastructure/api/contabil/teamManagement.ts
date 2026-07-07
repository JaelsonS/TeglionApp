import { api } from '@/infrastructure/api'
import type { TeamDepartment, TeamMember, TeamPermissionsView } from '@/shared/types/teamManagement'

export const teamManagementApi = {
    listMembers: () => api.get('/contabil/team').then((r) => r.data as { items: TeamMember[] }),

    createMemberDirect: (payload: {
        fullName: string
        email: string
        role?: TeamMember['role']
        jobTitle?: string | null
        password: string
        departmentId?: string | null
        sendWelcomeEmail?: boolean
    }) => api.post('/contabil/team', { ...payload, creationMode: 'DIRECT' }).then((r) => r.data as { member: TeamMember }),

    patchMember: (memberId: string, payload: Partial<Pick<TeamMember, 'fullName' | 'email' | 'role' | 'jobTitle'>> & { departmentId?: string | null }) =>
        api.patch(`/contabil/team/${encodeURIComponent(memberId)}`, payload).then((r) => r.data as { member: TeamMember }),

    deactivateMember: (memberId: string) =>
        api.post(`/contabil/team/${encodeURIComponent(memberId)}/deactivate`).then((r) => r.data as { member: TeamMember }),

    reactivateMember: (memberId: string) =>
        api.post(`/contabil/team/${encodeURIComponent(memberId)}/reactivate`).then((r) => r.data as { member: TeamMember }),

    createInvite: (payload: {
        fullName: string
        email: string
        role?: TeamMember['role']
        jobTitle?: string | null
        departmentId?: string | null
    }) => api.post('/contabil/team/invites', payload).then((r) => r.data as { member: TeamMember; invite: { id: string; expiresAt: string } }),

    resendInvite: (memberId: string) =>
        api.post(`/contabil/team/${encodeURIComponent(memberId)}/resend-invite`).then((r) => r.data as { invite: { id: string; expiresAt: string } }),

    revokeInvite: (memberId: string) =>
        api.post(`/contabil/team/${encodeURIComponent(memberId)}/revoke-invite`).then((r) => r.data as { revoked: boolean }),

    listDepartments: () => api.get('/contabil/departments').then((r) => r.data as { items: TeamDepartment[] }),

    createDepartment: (payload: { name: string; code?: string; color?: string }) =>
        api.post('/contabil/departments', payload).then((r) => r.data as { department: TeamDepartment }),

    patchDepartment: (departmentId: string, payload: { name?: string; code?: string | null; color?: string | null; isActive?: boolean }) =>
        api.patch(`/contabil/departments/${encodeURIComponent(departmentId)}`, payload).then((r) => r.data as { department: TeamDepartment }),

    removeDepartment: (departmentId: string) =>
        api.delete(`/contabil/departments/${encodeURIComponent(departmentId)}`).then((r) => r.data as { department: TeamDepartment }),

    getMemberPermissions: (memberId: string) =>
        api.get(`/contabil/team/${encodeURIComponent(memberId)}/permissions`).then((r) => r.data as TeamPermissionsView),

    patchMemberPermissions: (memberId: string, payload: { mode: 'INHERIT' | 'OVERRIDE'; permissions?: string[] }) =>
        api.patch(`/contabil/team/${encodeURIComponent(memberId)}/permissions`, payload).then((r) => r.data as {
            memberId: string
            mode: 'INHERIT' | 'OVERRIDE'
            overridePermissions: string[] | null
            effectivePermissions: string[]
        }),
}

export const teamInvitePublicApi = {
    preview: (token: string) =>
        api.get(`/public/team-invite/${encodeURIComponent(token)}`).then((r) =>
            r.data as { firmName: string; emailHint: string; fullNameHint?: string | null; expiresAt: string },
        ),

    accept: (token: string, payload: { fullName: string; email: string; password: string }) =>
        api.post(`/public/team-invite/${encodeURIComponent(token)}/accept`, payload).then((r) =>
            r.data as { success: boolean; emailConfirmationRequired: boolean },
        ),

    confirmEmail: (token: string) =>
        api.get(`/public/team-email-confirm/${encodeURIComponent(token)}`).then((r) => r.data as { confirmed: boolean }),
}
