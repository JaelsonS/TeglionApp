import { type ChangeEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, MailPlus, Pencil, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'

import { teamManagementApi } from '@/infrastructure/api/contabil/teamManagement'
import { getErrorMessage } from '@/shared/utils/errors'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { Label } from '@/shared/components/ui/label'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import type { FirmSettingsBundle } from '@/shared/types/firmSettings'
import type { TeamMember } from '@/shared/types/teamManagement'
import { cn } from '@/shared/lib/utils'

type Props = {
    bundle: FirmSettingsBundle
}

type PermissionMeta = {
    label: string
    description: string
    group: string
}

const PERMISSION_META: Record<string, PermissionMeta> = {
    FIRM_READ: { label: 'Ver dados do escritório', description: 'Permite visualizar informações gerais e contexto do escritório.', group: 'Escritório' },
    FIRM_CONSULTATIONS_MANAGE: { label: 'Gerir agenda e consultorias', description: 'Criar, editar e acompanhar marcações na agenda.', group: 'Operação' },
    USERS_READ: { label: 'Ver utilizadores', description: 'Visualizar colaboradores e dados básicos da equipa.', group: 'Equipa' },
    USERS_CREATE: { label: 'Criar utilizadores', description: 'Criar novos acessos de colaboradores.', group: 'Equipa' },
    USERS_CREATE_ADMIN: { label: 'Criar utilizadores administradores', description: 'Permite criar utilizadores com acesso administrativo.', group: 'Equipa' },
    USERS_UPDATE: { label: 'Editar utilizadores', description: 'Atualizar dados de colaboradores.', group: 'Equipa' },
    USERS_DELETE: { label: 'Desativar utilizadores', description: 'Desativar/restringir acesso de utilizadores.', group: 'Equipa' },
    FIRM_CLIENTS_VIEW: { label: 'Ver carteira de clientes', description: 'Consultar empresas/clientes do escritório.', group: 'Clientes' },
    FIRM_CLIENTS_MANAGE: { label: 'Gerir carteira de clientes', description: 'Criar/editar clientes e respetivos dados.', group: 'Clientes' },
    FIRM_ACCOUNTING_SERVICES_VIEW: { label: 'Ver serviços contabilísticos', description: 'Consultar catálogo e pedidos de serviços.', group: 'Operação' },
    FIRM_ACCOUNTING_SERVICES_MANAGE: { label: 'Gerir serviços contabilísticos', description: 'Criar, editar e acompanhar serviços.', group: 'Operação' },
    FIRM_OBLIGATIONS_MANAGE: { label: 'Gerir obrigações fiscais', description: 'Gerir obrigações, prazos e estados de cumprimento.', group: 'Fiscal' },
    FIRM_DOCUMENTS_MANAGE: { label: 'Gerir documentos', description: 'Validar, organizar e solicitar documentos.', group: 'Documentos' },
    FIRM_TASKS_MANAGE: { label: 'Gerir tarefas', description: 'Criar e acompanhar tarefas operacionais.', group: 'Operação' },
    FIRM_MESSAGES_MANAGE: { label: 'Gerir mensagens', description: 'Aceder e responder a mensagens com clientes.', group: 'Comunicação' },
    FIRM_BILLING_MANAGE: { label: 'Gerir faturação e plano', description: 'Aceder à subscrição, faturação e pagamentos.', group: 'Administração' },
    FIRM_SETTINGS_MANAGE: { label: 'Gerir definições do escritório', description: 'Alterar configurações globais do escritório.', group: 'Administração' },
    FIRM_TEAM_MANAGE: { label: 'Gerir equipa', description: 'Gerir estrutura da equipa e respetivos acessos.', group: 'Equipa' },
    FIRM_DEPARTMENTS_MANAGE: { label: 'Gerir departamentos', description: 'Criar e manter departamentos internos.', group: 'Equipa' },
    FIRM_INVITES_MANAGE: { label: 'Gerir convites', description: 'Enviar, reenviar e revogar convites de equipa.', group: 'Equipa' },
    FIRM_MEMBER_ROLE_MANAGE: { label: 'Alterar perfil de acesso', description: 'Alterar nível de acesso/função dos membros.', group: 'Equipa' },
    FIRM_MEMBER_DEPARTMENT_MANAGE: { label: 'Alterar departamento do membro', description: 'Mover membros entre departamentos.', group: 'Equipa' },
    FIRM_MEMBER_PERMISSION_MANAGE: { label: 'Personalizar permissões do membro', description: 'Ajustar permissões individuais por colaborador.', group: 'Equipa' },
    FIRM_TEAM_AUDIT_VIEW: { label: 'Ver auditoria da equipa', description: 'Consultar histórico de alterações e acessos da equipa.', group: 'Auditoria' },
    FIRM_REPORTS_VIEW: { label: 'Ver relatórios', description: 'Aceder a relatórios de gestão do escritório.', group: 'Relatórios' },
}

function permissionMeta(permission: string): PermissionMeta {
    return PERMISSION_META[permission] || {
        label: permission,
        description: 'Permissão técnica sem descrição detalhada.',
        group: 'Outros',
    }
}

type TeamView = 'create' | 'invite' | 'departments' | 'list'

type TeamSettingsMember = TeamMember & {
    isCurrentUser?: boolean
    isOwner?: boolean
    roleLabel?: string
}

function focusAndReveal(el: HTMLElement | null) {
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
    const focusable = el.querySelector<HTMLElement>(
        'input:not([type="checkbox"]):not([type="hidden"]):not([type="radio"]), select, textarea',
    )
    window.setTimeout(() => focusable?.focus(), 280)
}

export function FirmSettingsTeamSection({ bundle }: Props) {
    const queryClient = useQueryClient()
    const [teamView, setTeamView] = useState<TeamView>('create')
    const panelRef = useRef<HTMLDivElement>(null)
    const [directForm, setDirectForm] = useState({
        fullName: '',
        email: '',
        jobTitle: '',
        password: '',
        departmentId: '',
        sendWelcomeEmail: true,
    })
    const [inviteForm, setInviteForm] = useState({
        fullName: '',
        email: '',
        jobTitle: '',
        departmentId: '',
    })
    const [departmentName, setDepartmentName] = useState('')
    const [permissionsMemberId, setPermissionsMemberId] = useState<string | null>(null)
    const [overrideMode, setOverrideMode] = useState<'INHERIT' | 'OVERRIDE'>('INHERIT')
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
    const [excludeMember, setExcludeMember] = useState<TeamSettingsMember | null>(null)
    const [showInactiveMembers, setShowInactiveMembers] = useState(false)
    const [editForm, setEditForm] = useState({
        fullName: '',
        email: '',
        jobTitle: '',
        departmentId: '',
    })

    useEffect(() => {
        focusAndReveal(panelRef.current)
    }, [teamView])

    const openTeamView = (view: TeamView) => {
        setTeamView(view)
        if (view === 'list') setShowInactiveMembers(false)
        if (view === 'invite') setShowInactiveMembers(true)
    }

    const teamQuery = useQuery({
        queryKey: ['team-management-members'],
        queryFn: () => teamManagementApi.listMembers(),
    })
    const departmentsQuery = useQuery({
        queryKey: ['team-management-departments'],
        queryFn: () => teamManagementApi.listDepartments(),
    })
    const permissionsQuery = useQuery({
        queryKey: ['team-member-permissions', permissionsMemberId],
        queryFn: () => teamManagementApi.getMemberPermissions(String(permissionsMemberId)),
        enabled: Boolean(permissionsMemberId),
    })

    const teamItems = teamQuery.data?.items || []
    const departments = departmentsQuery.data?.items || []
    const members = (teamItems.length ? teamItems : bundle.team) as TeamSettingsMember[]

    const invalidate = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['team-management-members'] }),
            queryClient.invalidateQueries({ queryKey: ['team-management-departments'] }),
            queryClient.invalidateQueries({ queryKey: ['firm-settings'] }),
        ])
    }

    const createDirectMutation = useMutation({
        mutationFn: () =>
            teamManagementApi.createMemberDirect({
                fullName: directForm.fullName,
                email: directForm.email,
                jobTitle: directForm.jobTitle || null,
                password: directForm.password,
                departmentId: directForm.departmentId || null,
                sendWelcomeEmail: directForm.sendWelcomeEmail,
            }),
        onSuccess: async (result) => {
            if (directForm.sendWelcomeEmail && result?.welcomeEmailSent === false) {
                toast.warning('Colaborador criado, mas o e-mail de boas-vindas não foi enviado. Partilhe a palavra-passe manualmente.')
            } else {
                toast.success('Colaborador criado com sucesso.')
            }
            setDirectForm({
                fullName: '',
                email: '',
                jobTitle: '',
                password: '',
                departmentId: '',
                sendWelcomeEmail: true,
            })
            setTeamView('list')
            await invalidate()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const createInviteMutation = useMutation({
        mutationFn: () =>
            teamManagementApi.createInvite({
                fullName: inviteForm.fullName,
                email: inviteForm.email,
                jobTitle: inviteForm.jobTitle || null,
                departmentId: inviteForm.departmentId || null,
            }),
        onSuccess: async (result) => {
            if (result?.emailSent === false) {
                toast.warning('Convite criado, mas o e-mail falhou. Use Reenviar convite.')
            } else {
                toast.success('Convite enviado com sucesso.')
            }
            setInviteForm({ fullName: '', email: '', jobTitle: '', departmentId: '' })
            setTeamView('list')
            await invalidate()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const createDepartmentMutation = useMutation({
        mutationFn: () => teamManagementApi.createDepartment({ name: departmentName }),
        onSuccess: async () => {
            toast.success('Departamento criado.')
            setDepartmentName('')
            await invalidate()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const updateMemberMutation = useMutation({
        mutationFn: () => {
            if (!editingMemberId) throw new Error('Membro não selecionado.')
            return teamManagementApi.patchMember(editingMemberId, {
                fullName: editForm.fullName,
                email: editForm.email,
                jobTitle: editForm.jobTitle || null,
                departmentId: editForm.departmentId || null,
            })
        },
        onSuccess: async () => {
            toast.success('Dados do colaborador atualizados.')
            setEditingMemberId(null)
            await invalidate()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const toggleMemberMutation = useMutation({
        mutationFn: ({ memberId, active }: { memberId: string; active: boolean }) =>
            active ? teamManagementApi.deactivateMember(memberId) : teamManagementApi.reactivateMember(memberId),
        onSuccess: async (_, vars) => {
            toast.success(vars.active ? 'Membro desativado.' : 'Membro reativado.')
            await invalidate()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const inviteActionMutation = useMutation({
        mutationFn: async ({ memberId, mode }: { memberId: string; mode: 'RESEND' | 'REVOKE' }) => {
            if (mode === 'RESEND') {
                return teamManagementApi.resendInvite(memberId)
            } else {
                await teamManagementApi.revokeInvite(memberId)
            }
            return { ok: true, emailSent: true }
        },
        onSuccess: async (result, vars) => {
            if (vars.mode === 'RESEND' && result?.emailSent === false) {
                toast.warning('Convite recriado, mas o e-mail falhou. Tente novamente.')
            } else {
                toast.success(vars.mode === 'RESEND' ? 'Convite reenviado.' : 'Convite revogado.')
            }
            await invalidate()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const patchPermissionsMutation = useMutation({
        mutationFn: () =>
            teamManagementApi.patchMemberPermissions(String(permissionsMemberId), {
                mode: overrideMode,
                permissions: overrideMode === 'OVERRIDE' ? selectedPermissions : undefined,
            }),
        onSuccess: async () => {
            toast.success('Permissões atualizadas.')
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['team-member-permissions', permissionsMemberId] }),
                queryClient.invalidateQueries({ queryKey: ['team-management-members'] }),
            ])
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const ownerCount = useMemo(() => members.filter((m) => m.role === 'FIRM_OWNER' && m.isActive).length, [members])
    const visibleMembers = useMemo(
        () => (showInactiveMembers ? members : members.filter((m) => m.isActive || m.inviteStatus === 'PENDING')),
        [members, showInactiveMembers],
    )

    const teamStats = useMemo(() => {
        const activeCount = members.filter((m) => m.isActive).length
        const pendingCount = members.filter((m) => m.inviteStatus === 'PENDING').length
        const deptCount = departments.filter((d) => d.isActive !== false).length
        return { activeCount, pendingCount, deptCount }
    }, [members, departments])

    const canManageTeam = bundle.capabilities.canManageTeam

    const excludeMemberMutation = useMutation({
        mutationFn: async (member: TeamSettingsMember) => {
            if (member.inviteStatus === 'PENDING') {
                await teamManagementApi.revokeInvite(member.id)
                return
            }
            if (member.isActive) {
                await teamManagementApi.deactivateMember(member.id)
            }
        },
        onSuccess: async () => {
            toast.success('Colaborador excluído da equipa.')
            setExcludeMember(null)
            await invalidate()
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    })

    const openEditMember = (member: TeamSettingsMember) => {
        setEditingMemberId(member.id)
        setEditForm({
            fullName: member.fullName || '',
            email: member.email || '',
            jobTitle: member.jobTitle || '',
            departmentId: member.departmentId || '',
        })
        window.setTimeout(() => {
            document.getElementById('equipa-editar-membro')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 50)
    }

    const renderAccessLabel = (member: TeamSettingsMember) => {
        if (member.role === 'FIRM_OWNER') return 'Dono do escritório'
        return 'Colaborador'
    }

    return (
        <section id="equipa" className="cb-settings-panel scroll-mt-24">
            <div className="cb-settings-panel-hd">
                <span className="cb-settings-panel-icon">
                    <Users className="h-4 w-4" aria-hidden />
                </span>
                <div>
                    <h2 className="cb-settings-panel-title">Equipa e departamentos</h2>
                    <p className="cb-settings-panel-sub">
                        O dono do escritório define o cargo/função e o departamento de cada colaborador.
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <button
                    type="button"
                    className={cn(
                        'cb-settings-stat cb-settings-stat--team',
                        teamView === 'list' && 'ring-2 ring-brand/40',
                    )}
                    onClick={() => openTeamView('list')}
                >
                    <p className="cb-settings-stat-label">Colaboradores activos</p>
                    <p className="cb-settings-stat-value">{teamStats.activeCount}</p>
                    <p className="cb-settings-stat-hint">Ver lista</p>
                </button>
                <button
                    type="button"
                    className={cn(
                        'cb-settings-stat cb-settings-stat--depts',
                        teamView === 'departments' && 'ring-2 ring-brand/40',
                    )}
                    onClick={() => openTeamView('departments')}
                >
                    <p className="cb-settings-stat-label">Departamentos</p>
                    <p className="cb-settings-stat-value">{teamStats.deptCount}</p>
                    <p className="cb-settings-stat-hint">Gerir departamentos</p>
                </button>
                <button
                    type="button"
                    className={cn(
                        'cb-settings-stat cb-settings-stat--invites',
                        teamView === 'invite' && 'ring-2 ring-brand/40',
                    )}
                    onClick={() => openTeamView(canManageTeam ? 'invite' : 'list')}
                >
                    <p className="cb-settings-stat-label">Convites pendentes</p>
                    <p className="cb-settings-stat-value">{teamStats.pendingCount}</p>
                    <p className="cb-settings-stat-hint">{canManageTeam ? 'Convidar por e-mail' : 'Ver lista'}</p>
                </button>
            </div>

            {canManageTeam ? (
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Acções da equipa">
                    {(
                        [
                            { id: 'create' as const, label: 'Criar colaborador', icon: UserPlus },
                            { id: 'invite' as const, label: 'Convidar por e-mail', icon: MailPlus },
                            { id: 'departments' as const, label: 'Departamentos', icon: Users },
                            { id: 'list' as const, label: 'Ver lista', icon: Users },
                        ] as const
                    ).map((item) => {
                        const Icon = item.icon
                        const active = teamView === item.id
                        return (
                            <Button
                                key={item.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                variant={active ? 'default' : 'outline'}
                                size="sm"
                                className={cn('rounded-full', active && 'shadow-sm')}
                                onClick={() => openTeamView(item.id)}
                            >
                                <Icon className="mr-1.5 h-3.5 w-3.5" />
                                {item.label}
                            </Button>
                        )
                    })}
                </div>
            ) : null}

            <div className="cb-settings-tip">
                <p>
                    Dica: use termos simples de negócio como <strong>Receção</strong>, <strong>Fiscal</strong>,{' '}
                    <strong>Contabilidade</strong> e <strong>Apoio ao cliente</strong> para facilitar o uso por toda a
                    equipa.
                </p>
            </div>

            {!canManageTeam ? (
                <p className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                    Pode consultar membros, cargo e departamento. Para criar ou convidar colaboradores precisa da
                    permissão de gestão de equipa — peça ao dono do escritório se necessário.
                </p>
            ) : null}

            {canManageTeam && teamView === 'create' ? (
                <div ref={panelRef} id="equipa-convidar" className="cb-settings-action-card scroll-mt-24">
                    <div className="cb-settings-action-card-hd cb-settings-action-card-hd--direct">
                        <span className="cb-settings-action-icon">
                            <UserPlus className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                            <p className="cb-settings-action-title">Criar colaborador</p>
                            <p className="cb-settings-action-sub">Acesso direto com palavra-passe</p>
                        </div>
                    </div>
                    <div className="cb-settings-action-body">
                        <Input
                            placeholder="Nome completo"
                            value={directForm.fullName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setDirectForm((s) => ({ ...s, fullName: e.target.value }))}
                        />
                        <Input
                            placeholder="email@empresa.com"
                            type="email"
                            value={directForm.email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setDirectForm((s) => ({ ...s, email: e.target.value }))}
                        />
                        <Input
                            placeholder="Cargo / Função (ex.: Assistente Fiscal)"
                            value={directForm.jobTitle}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setDirectForm((s) => ({ ...s, jobTitle: e.target.value }))}
                        />
                        <PasswordInput
                            placeholder="Palavra-passe (mín. 10, maiúscula, minúscula e número)"
                            value={directForm.password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setDirectForm((s) => ({ ...s, password: e.target.value }))}
                            autoComplete="new-password"
                        />
                        <p className="text-xs text-muted-foreground">
                            A palavra-passe não é enviada por e-mail. Se activar o aviso de boas-vindas, o colaborador
                            recebe apenas o link de login — partilhe a palavra-passe por um canal seguro.
                        </p>
                        <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={directForm.departmentId}
                            onChange={(e) => setDirectForm((s) => ({ ...s, departmentId: e.target.value }))}
                        >
                            <option value="">Sem departamento</option>
                            {departments
                                .filter((d) => d.isActive)
                                .map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                        </select>
                        <Label className="flex items-center gap-2 text-sm font-normal">
                            <Checkbox
                                checked={directForm.sendWelcomeEmail}
                                onCheckedChange={(checked: boolean | 'indeterminate') =>
                                    setDirectForm((s) => ({ ...s, sendWelcomeEmail: checked === true }))
                                }
                            />
                            Enviar e-mail de boas-vindas com instruções
                        </Label>
                        <Button
                            type="button"
                            className="cb-btn-primary w-full justify-center"
                            disabled={createDirectMutation.isPending}
                            onClick={() => createDirectMutation.mutate()}
                        >
                            {createDirectMutation.isPending ? 'A criar...' : 'Criar colaborador'}
                        </Button>
                    </div>
                </div>
            ) : null}

            {canManageTeam && teamView === 'invite' ? (
                <div ref={panelRef} id="equipa-convite-email" className="cb-settings-action-card scroll-mt-24">
                    <div className="cb-settings-action-card-hd cb-settings-action-card-hd--invite">
                        <span className="cb-settings-action-icon">
                            <MailPlus className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                            <p className="cb-settings-action-title">Convidar por e-mail</p>
                            <p className="cb-settings-action-sub">O colaborador define a palavra-passe</p>
                        </div>
                    </div>
                    <div className="cb-settings-action-body">
                        <Input
                            id="equipa-invite-fullName"
                            placeholder="Nome completo"
                            value={inviteForm.fullName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setInviteForm((s) => ({ ...s, fullName: e.target.value }))}
                        />
                        <Input
                            placeholder="email@empresa.com"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setInviteForm((s) => ({ ...s, email: e.target.value }))}
                        />
                        <Input
                            placeholder="Cargo / Função (ex.: Gestor de clientes)"
                            value={inviteForm.jobTitle}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setInviteForm((s) => ({ ...s, jobTitle: e.target.value }))}
                        />
                        <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={inviteForm.departmentId}
                            onChange={(e) => setInviteForm((s) => ({ ...s, departmentId: e.target.value }))}
                        >
                            <option value="">Sem departamento</option>
                            {departments
                                .filter((d) => d.isActive)
                                .map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                        </select>
                        <Button
                            type="button"
                            className="cb-btn-primary w-full justify-center"
                            disabled={createInviteMutation.isPending}
                            onClick={() => createInviteMutation.mutate()}
                        >
                            {createInviteMutation.isPending ? 'A enviar...' : 'Enviar convite'}
                        </Button>
                    </div>
                </div>
            ) : null}

            {canManageTeam && teamView === 'departments' ? (
                <div ref={panelRef} id="equipa-departamentos" className="cb-settings-action-card scroll-mt-24">
                    <div className="cb-settings-action-card-hd cb-settings-action-card-hd--depts">
                        <span className="cb-settings-action-icon">
                            <Users className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                            <p className="cb-settings-action-title">Departamentos</p>
                            <p className="cb-settings-action-sub">Organização interna do escritório</p>
                        </div>
                    </div>
                    <div className="cb-settings-action-body">
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                placeholder="Novo departamento (ex.: Fiscal, Receção)"
                                value={departmentName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setDepartmentName(e.target.value)}
                                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        if (departmentName.trim()) createDepartmentMutation.mutate()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                className="shrink-0"
                                onClick={() => createDepartmentMutation.mutate()}
                                disabled={createDepartmentMutation.isPending || !departmentName.trim()}
                            >
                                {createDepartmentMutation.isPending ? 'A adicionar...' : 'Adicionar'}
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {departments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Ainda não tem departamentos. Crie o primeiro acima.</p>
                            ) : (
                                departments.map((d) => (
                                    <span key={d.id} className="cb-settings-dept-chip">
                                        {d.name}
                                        {d.isActive ? '' : ' (inativo)'}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            <div
                ref={teamView === 'list' ? panelRef : undefined}
                id="equipa-membros"
                className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm scroll-mt-24"
            >
                {canManageTeam ? (
                    <div className="flex items-center justify-between border-b border-border/40 bg-muted/15 px-4 py-2.5">
                        <p className="text-xs font-medium text-muted-foreground">{visibleMembers.length} colaboradores visíveis</p>
                        <Label className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                            <Checkbox
                                checked={showInactiveMembers}
                                onCheckedChange={(checked: boolean | 'indeterminate') => setShowInactiveMembers(checked === true)}
                            />
                            Mostrar inativos
                        </Label>
                    </div>
                ) : null}
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                            <th className="px-4 py-2.5 font-medium">Nome</th>
                            <th className="hidden px-4 py-2.5 font-medium sm:table-cell">E-mail</th>
                            <th className="px-4 py-2.5 font-medium">Cargo/Função</th>
                            <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Departamento</th>
                            <th className="px-4 py-2.5 font-medium">Estado</th>
                            <th className="px-4 py-2.5 font-medium">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleMembers.map((m) => (
                            <tr
                                key={m.id}
                                className={`border-b border-border/40 last:border-0 ${canManageTeam ? 'cursor-pointer transition-colors hover:bg-brand/[0.04]' : ''}`}
                                onClick={() => {
                                    if (canManageTeam) openEditMember(m)
                                }}
                            >
                                <td className="px-4 py-3 font-medium text-foreground">
                                    {m.fullName || '—'}
                                    {m.isCurrentUser ? (
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">(você)</span>
                                    ) : null}
                                </td>
                                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{m.email}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    <div>{m.jobTitle || renderAccessLabel(m)}</div>
                                    <div className="mt-0.5 text-[11px]">Nível: {renderAccessLabel(m)}</div>
                                </td>
                                <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                                    {m.departmentName || m.department?.name || 'Sem departamento'}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground">
                                    {m.isActive ? 'Ativo' : 'Inativo'}
                                    {m.inviteStatus === 'PENDING' ? ' · convite pendente' : ''}
                                </td>
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-wrap gap-2">
                                        {canManageTeam ? (
                                            <>
                                                <Button type="button" variant="outline" size="sm" onClick={() => openEditMember(m)}>
                                                    <Pencil className="mr-1 h-3.5 w-3.5" />
                                                    Editar dados
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPermissionsMemberId(m.id)}
                                                >
                                                    <KeyRound className="mr-1 h-3.5 w-3.5" />
                                                    Permissões
                                                </Button>
                                                {m.inviteStatus === 'PENDING' ? (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => inviteActionMutation.mutate({ memberId: m.id, mode: 'RESEND' })}
                                                        >
                                                            Reenviar convite
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => inviteActionMutation.mutate({ memberId: m.id, mode: 'REVOKE' })}
                                                        >
                                                            Revogar convite
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={m.role === 'FIRM_OWNER' && ownerCount <= 1 && m.isActive}
                                                            onClick={() => toggleMemberMutation.mutate({ memberId: m.id, active: m.isActive })}
                                                        >
                                                            {m.isActive ? 'Desativar' : 'Reativar'}
                                                        </Button>
                                                        {!m.isCurrentUser ? (
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={m.role === 'FIRM_OWNER' && ownerCount <= 1 && m.isActive}
                                                                onClick={() => setExcludeMember(m)}
                                                            >
                                                                Excluir
                                                            </Button>
                                                        ) : null}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Visualização disponível</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {canManageTeam && editingMemberId ? (
                <div id="equipa-editar-membro" className="cb-settings-action-card scroll-mt-24">
                    <div className="cb-settings-action-card-hd cb-settings-action-card-hd--direct">
                        <span className="cb-settings-action-icon">
                            <Pencil className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                            <p className="cb-settings-action-title">Editar colaborador</p>
                            <p className="cb-settings-action-sub">Clique numa linha da lista para abrir</p>
                        </div>
                    </div>
                    <div className="cb-settings-action-body">
                    <div className="grid gap-2 md:grid-cols-2">
                        <Input
                            placeholder="Nome completo"
                            value={editForm.fullName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditForm((s) => ({ ...s, fullName: e.target.value }))}
                        />
                        <Input
                            placeholder="email@empresa.com"
                            type="email"
                            value={editForm.email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                        />
                        <Input
                            placeholder="Cargo / Função"
                            value={editForm.jobTitle}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditForm((s) => ({ ...s, jobTitle: e.target.value }))}
                        />
                        <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={editForm.departmentId}
                            onChange={(e) => setEditForm((s) => ({ ...s, departmentId: e.target.value }))}
                        >
                            <option value="">Sem departamento</option>
                            {departments
                                .filter((d) => d.isActive)
                                .map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Button type="button" size="sm" onClick={() => updateMemberMutation.mutate()}>
                            Guardar alterações
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setEditingMemberId(null)}>
                            Cancelar
                        </Button>
                    </div>
                    </div>
                </div>
            ) : null}

            {permissionsMemberId ? (
                <div className="rounded-lg border border-border/60 p-4">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <ShieldCheck className="h-4 w-4" />
                        Permissões do membro
                    </p>
                    {permissionsQuery.isLoading ? (
                        <p className="text-sm text-muted-foreground">A carregar permissões...</p>
                    ) : permissionsQuery.data ? (
                        <>
                            <div className="mb-3 flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={overrideMode === 'INHERIT' ? 'default' : 'outline'}
                                    onClick={() => {
                                        setOverrideMode('INHERIT')
                                        setSelectedPermissions([])
                                    }}
                                >
                                    Herdar do nível de acesso
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={overrideMode === 'OVERRIDE' ? 'default' : 'outline'}
                                    onClick={() => {
                                        const base = permissionsQuery.data?.overridePermissions || permissionsQuery.data?.effectivePermissions || []
                                        setOverrideMode('OVERRIDE')
                                        setSelectedPermissions(base)
                                    }}
                                >
                                    Personalizar
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setPermissionsMemberId(null)}>
                                    Fechar
                                </Button>
                            </div>
                            {overrideMode === 'OVERRIDE' ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        Selecione apenas o necessário para este colaborador. As permissões estão explicadas por área.
                                    </p>
                                    {Object.entries(
                                        permissionsQuery.data.availablePermissions.reduce<Record<string, string[]>>((acc, permission) => {
                                            const group = permissionMeta(permission).group
                                            acc[group] = acc[group] || []
                                            acc[group].push(permission)
                                            return acc
                                        }, {}),
                                    ).map(([group, items]) => (
                                        <div key={group} className="rounded-md border border-border/60 p-3">
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                {items.map((permission) => {
                                                    const checked = selectedPermissions.includes(permission)
                                                    const meta = permissionMeta(permission)
                                                    return (
                                                        <Label key={permission} className="flex items-start gap-2 rounded border border-border/60 p-2 text-xs font-normal">
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(next: boolean | 'indeterminate') => {
                                                                    setSelectedPermissions((prev) => {
                                                                        if (next === true) return [...prev, permission]
                                                                        return prev.filter((item) => item !== permission)
                                                                    })
                                                                }}
                                                            />
                                                            <span>
                                                                <span className="block text-sm font-medium text-foreground">{meta.label}</span>
                                                                <span className="block text-[11px] text-muted-foreground">{meta.description}</span>
                                                            </span>
                                                        </Label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Este membro vai seguir automaticamente as permissões padrão do nível de acesso atual.
                                </p>
                            )}
                            <div className="mt-3 flex gap-2">
                                <Button type="button" size="sm" onClick={() => patchPermissionsMutation.mutate()}>
                                    Guardar permissões
                                </Button>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground">Não foi possível carregar permissões.</p>
                    )}
                </div>
            ) : null}

            <ConfirmDialog
                open={Boolean(excludeMember)}
                onOpenChange={(open) => {
                    if (!open) setExcludeMember(null)
                }}
                title="Excluir colaborador"
                description={
                    excludeMember
                        ? `Confirma excluir ${excludeMember.fullName || excludeMember.email} da equipa? O acesso será removido e a conta ficará inativa.`
                        : 'Confirma excluir colaborador?'
                }
                confirmLabel={excludeMemberMutation.isPending ? 'A excluir...' : 'Excluir colaborador'}
                onConfirm={async () => {
                    if (!excludeMember) return
                    await excludeMemberMutation.mutateAsync(excludeMember)
                }}
                testId="team-exclude-member"
            >
                <p className="text-sm text-muted-foreground">
                    Esta ação não elimina histórico operacional, apenas remove o acesso do colaborador ao sistema.
                </p>
            </ConfirmDialog>
        </section>
    )
}
