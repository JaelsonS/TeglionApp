import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import type { FormChangeEvent, ButtonClickEvent } from '@/shared/types/react-events'
import { Copy, ExternalLink, Eye, EyeOff, KeyRound, Pencil, Plus, Shield, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { StepUpPasswordDialog } from '@/features/firm/client-hub/StepUpPasswordDialog'
import { VaultPasswordSetupForm } from '@/features/firm/client-hub/VaultPasswordSetupForm'
import type { OfficialAccessItem } from '@/features/firm/client-hub/officialAccesses.types'
import {
  clearVaultStepUpToken,
  persistVaultStepUpFromResponse,
  vaultUnlockPayload,
} from '@/features/firm/client-hub/vaultStepUpSession'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { FormField, Skeleton } from '@/shared/design-system'
import {
  useOfficialAccesses,
  useRemoveOfficialAccess,
  useRevealOfficialAccess,
  useUpsertOfficialAccess,
} from '@/shared/hooks/queries/useOfficialAccesses'
import { useAuth } from '@/shared/hooks/useAuth'
import { cn } from '@/shared/lib/utils'
import { getErrorMessage } from '@/shared/utils/errors'

type StepUpIntent =
  | { kind: 'save'; item: OfficialAccessItem }
  | { kind: 'reveal'; item: OfficialAccessItem }
  | { kind: 'copy'; item: OfficialAccessItem }
  | { kind: 'remove'; item: OfficialAccessItem }
  | { kind: 'create-custom' }

type Draft = { username: string; password: string; label: string }

function rowKey(item: OfficialAccessItem) {
  return `${item.portalKey}-${item.id || 'empty'}`
}

function emptyDraft(item: OfficialAccessItem): Draft {
  return {
    username: item.username || '',
    password: '',
    label: item.label || item.shortTitle || item.title || '',
  }
}

function displayPortalName(item: OfficialAccessItem) {
  return item.label || item.shortTitle || item.title
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}

function IconAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={(e: ButtonClickEvent) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {children}
    </Button>
  )
}

function PortalRow({
  item,
  disabled,
  expanded,
  revealedPassword,
  secondsLeft,
  onToggle,
  onSave,
  onReveal,
  onCopyPassword,
  onHide,
  onRemove,
}: {
  item: OfficialAccessItem
  disabled: boolean
  expanded: boolean
  revealedPassword: string | null
  secondsLeft: number
  onToggle: () => void
  onSave: (item: OfficialAccessItem, draft: Draft) => void
  onReveal: (item: OfficialAccessItem) => void
  onCopyPassword: (item: OfficialAccessItem) => void
  onHide: () => void
  onRemove: (item: OfficialAccessItem) => void
}) {
  const [draft, setDraft] = useState(() => emptyDraft(item))
  const fieldId = item.id || item.portalKey
  const displayName = displayPortalName(item)

  useEffect(() => {
    setDraft(emptyDraft(item))
  }, [item.id, item.username, item.hasPassword, item.updatedAt, item.label, item.shortTitle, item.title])

  const dirty = useMemo(() => {
    const usernameChanged = draft.username.trim() !== (item.username || '')
    const labelChanged = draft.label.trim() !== displayPortalName(item)
    return usernameChanged || Boolean(draft.password) || labelChanged
  }, [draft, item])

  return (
    <div className={cn('border-b border-border/60 last:border-b-0', expanded && 'bg-muted/20')}>
      <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
          <p className="truncate text-caption text-muted-foreground">
            {item.username || 'Sem utilizador'}
            {item.hasPassword ? '' : ' · sem senha'}
          </p>
        </button>
        <div className="flex shrink-0 items-center">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`Abrir ${displayName}`}
              title="Abrir portal"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
          <IconAction
            label="Copiar utilizador"
            disabled={disabled || !item.username}
            onClick={async () => {
              if (!item.username) return
              await copyToClipboard(item.username)
              toast.success('Utilizador copiado')
            }}
          >
            <UserRound className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction
            label={revealedPassword ? 'Ocultar senha' : 'Ver senha'}
            disabled={disabled || !item.hasPassword || !item.id}
            onClick={() => {
              if (revealedPassword) {
                onHide()
                return
              }
              onReveal(item)
            }}
          >
            {revealedPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </IconAction>
          <IconAction
            label="Copiar senha"
            disabled={disabled || !item.hasPassword || !item.id}
            onClick={() => onCopyPassword(item)}
          >
            <Copy className="h-3.5 w-3.5" />
          </IconAction>
          <IconAction label={expanded ? 'Fechar edição' : 'Editar'} disabled={disabled} onClick={onToggle}>
            <Pencil className="h-3.5 w-3.5" />
          </IconAction>
        </div>
      </div>

      {revealedPassword ? (
        <div className="flex items-center gap-2 px-3 pb-2 sm:px-4">
          <Input readOnly value={revealedPassword} className="h-8 font-mono text-xs tracking-wide" autoComplete="off" />
          <span className="shrink-0 text-caption text-muted-foreground">Some em {secondsLeft}s</span>
        </div>
      ) : null}

      {expanded ? (
        <div className="space-y-3 border-t border-border/50 px-3 py-3 sm:px-4">
          <FormField
            label="Nome do portal"
            hint="Pode mudar se este cliente não usa AT, SS, ViaCTT, IAPMEI ou RU."
            htmlFor={`oa-label-${fieldId}`}
          >
            <Input
              id={`oa-label-${fieldId}`}
              value={draft.label}
              onChange={(e: FormChangeEvent) => setDraft((d) => ({ ...d, label: e.target.value }))}
              disabled={disabled}
              maxLength={80}
              autoComplete="off"
              placeholder={item.shortTitle || item.title}
            />
          </FormField>
          <FormField label={item.usernameLabel} htmlFor={`oa-user-${fieldId}`}>
            <Input
              id={`oa-user-${fieldId}`}
              value={draft.username}
              onChange={(e: FormChangeEvent) => setDraft((d) => ({ ...d, username: e.target.value }))}
              disabled={disabled}
              autoComplete="off"
              spellCheck={false}
            />
          </FormField>
          <FormField
            label={item.hasPassword ? 'Nova senha' : 'Palavra-passe'}
            hint={item.hasPassword ? 'Em branco mantém a senha actual.' : undefined}
            htmlFor={`oa-pass-${fieldId}`}
          >
            <PasswordInput
              id={`oa-pass-${fieldId}`}
              value={draft.password}
              onChange={(e: FormChangeEvent) => setDraft((d) => ({ ...d, password: e.target.value }))}
              disabled={disabled}
              autoComplete="new-password"
              placeholder={item.hasPassword ? 'Opcional' : 'Senha do portal'}
            />
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={disabled || !dirty} onClick={() => onSave(item, draft)}>
              Guardar
            </Button>
            {item.id && item.hasPassword ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive"
                disabled={disabled}
                onClick={() => onRemove(item)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remover senha
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ClientHubOfficialAccessesPanel({ clientId }: { clientId: string }) {
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = useOfficialAccesses(clientId)
  const upsert = useUpsertOfficialAccess(clientId)
  const reveal = useRevealOfficialAccess(clientId)
  const remove = useRemoveOfficialAccess(clientId)
  const [stepUp, setStepUp] = useState<StepUpIntent | null>(null)
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customUsername, setCustomUsername] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<{ accessId: string; value: string } | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const items = data?.items || []
  const security = data?.security
  const revealTtl = security?.revealTtlSeconds || 30
  const mfaRequired = Boolean(security?.mfaRequired)
  const canUnlock = Boolean(
    security?.canUnlock ?? security?.hasLocalPassword ?? security?.hasVaultPassword ?? mfaRequired,
  )
  const disabled = !canUnlock || upsert.isPending || remove.isPending || reveal.isPending
  const userId = user?.id

  useEffect(() => {
    if (!revealed) {
      setSecondsLeft(0)
      return undefined
    }
    setSecondsLeft(revealTtl)
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    const timer = window.setTimeout(() => setRevealed(null), revealTtl * 1000)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(timer)
    }
  }, [revealed, revealTtl])

  function purposeForIntent(intent: StepUpIntent): 'vault_reveal' | 'vault_mutate' {
    return intent.kind === 'reveal' || intent.kind === 'copy' ? 'vault_reveal' : 'vault_mutate'
  }

  function persistUnlock(
    data: { stepUpToken?: string; stepUpExpiresAt?: string | null } | undefined,
    remember: boolean,
    purpose: 'vault_reveal' | 'vault_mutate',
  ) {
    persistVaultStepUpFromResponse(userId, data, remember, purpose)
  }

  async function runUnlocked(
    intent: StepUpIntent,
    creds: {
      currentPassword?: string
      totpCode?: string
      stepUpToken?: string
      rememberSession?: boolean
    },
    draft: Draft | null,
  ) {
    const purpose = purposeForIntent(intent)
    if (intent.kind === 'save' && draft) {
      const result = await upsert.mutateAsync({
        ...creds,
        portalKey: intent.item.portalKey,
        accessId: intent.item.id,
        username: draft.username,
        password: draft.password || undefined,
        label: draft.label,
      })
      persistUnlock(result, creds.rememberSession !== false, purpose)
      setExpandedKey(null)
    } else if (intent.kind === 'create-custom') {
      const result = await upsert.mutateAsync({
        ...creds,
        portalKey: 'CUSTOM',
        label: customLabel,
        username: customUsername,
        password: customPassword,
      })
      persistUnlock(result, creds.rememberSession !== false, purpose)
      setCustomLabel('')
      setCustomUsername('')
      setCustomPassword('')
      setCustomOpen(false)
    } else if ((intent.kind === 'reveal' || intent.kind === 'copy') && intent.item.id) {
      const result = await reveal.mutateAsync({
        accessId: intent.item.id,
        ...creds,
      })
      persistUnlock(result, creds.rememberSession !== false, purpose)
      await applyRevealed(intent.item.id, result.revealedValue, intent.kind === 'copy')
    } else if (intent.kind === 'remove' && intent.item.id) {
      const result = await remove.mutateAsync({ accessId: intent.item.id, ...creds })
      persistUnlock(result, creds.rememberSession !== false, purpose)
      if (revealed?.accessId === intent.item.id) setRevealed(null)
      setExpandedKey(null)
    }
  }

  async function requestUnlock(intent: StepUpIntent, draft: Draft | null = null) {
    setStepUpError(null)
    const purpose = purposeForIntent(intent)
    const silent = vaultUnlockPayload(userId, purpose)
    if (silent.stepUpToken) {
      try {
        await runUnlocked(intent, silent, draft)
        setStepUp(null)
        setPendingDraft(null)
        return
      } catch {
        clearVaultStepUpToken(userId, purpose)
      }
    }
    setPendingDraft(draft)
    setStepUp(intent)
  }

  function requestSave(item: OfficialAccessItem, draft: Draft) {
    const hasName = Boolean(draft.label.trim())
    const hasUser = Boolean(draft.username.trim())
    const hasPass = Boolean(draft.password.trim())
    if (!item.id && !hasPass && !hasUser && !hasName) {
      toast.error('Indique o nome, o utilizador ou a palavra-passe deste portal para gravar.')
      return
    }
    if (item.portalKey === 'CUSTOM' && !hasName) {
      toast.error('Indique o nome deste portal.')
      return
    }
    void requestUnlock({ kind: 'save', item }, draft)
  }

  async function applyRevealed(accessId: string, value: string, copy: boolean) {
    setRevealed({ accessId, value })
    if (!copy) return
    try {
      await copyToClipboard(value)
      toast.success('Senha copiada', { description: `Some daqui a ${revealTtl}s.` })
    } catch {
      toast.error('Não foi possível copiar. Use o texto visível e copie à mão.')
    }
  }

  async function runStepUp(
    result: { currentPassword?: string; totpCode?: string; rememberSession: boolean },
  ) {
    if (!stepUp) return
    try {
      await runUnlocked(
        stepUp,
        {
          currentPassword: result.currentPassword,
          totpCode: result.totpCode,
          rememberSession: result.rememberSession,
        },
        pendingDraft,
      )
      setStepUp(null)
      setPendingDraft(null)
      setStepUpError(null)
    } catch (err) {
      if (!result.rememberSession && stepUp) clearVaultStepUpToken(userId, purposeForIntent(stepUp))
      setStepUpError(getErrorMessage(err))
    }
  }

  return (
    <section className="cb-client-hub-panel space-y-4 p-4 sm:p-5" data-testid="official-accesses-panel">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden />
          Acessos oficiais
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Senhas dos portais desta empresa. Só a equipa vê. Os nomes AT, SS, ViaCTT, IAPMEI e RU são
          sugestões — pode alterá-los. Confirma-se com a palavra-passe dos Acessos oficiais.
        </p>
      </div>

      {security && !canUnlock ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p className="mb-2 flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Crie uma palavra-passe só para este campo. Quem entra com Google também precisa dela —
              não é a senha da conta Google.
            </span>
          </p>
          <VaultPasswordSetupForm
            compact
            userId={userId}
            hasVaultPassword={Boolean(security.hasVaultPassword)}
            hasLoginPassword={Boolean(security.hasLocalPassword)}
            onUpdated={() => void refetch()}
          />
        </div>
      ) : null}

      {isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : null}
      {isError ? (
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os acessos oficiais.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {items.length ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          {items.map((item) => {
            const key = rowKey(item)
            return (
              <PortalRow
                key={key}
                item={item}
                disabled={disabled}
                expanded={expandedKey === key}
                revealedPassword={item.id && revealed?.accessId === item.id ? revealed.value : null}
                secondsLeft={secondsLeft}
                onToggle={() => setExpandedKey((current) => (current === key ? null : key))}
                onSave={requestSave}
                onReveal={(target) => {
                  void requestUnlock({ kind: 'reveal', item: target })
                }}
                onCopyPassword={async (target) => {
                  if (target.id && revealed?.accessId === target.id && revealed.value) {
                    try {
                      await copyToClipboard(revealed.value)
                      toast.success('Senha copiada')
                    } catch {
                      toast.error('Não foi possível copiar.')
                    }
                    return
                  }
                  void requestUnlock({ kind: 'copy', item: target })
                }}
                onHide={() => setRevealed(null)}
                onRemove={(target) => {
                  void requestUnlock({ kind: 'remove', item: target })
                }}
              />
            )
          })}
        </div>
      ) : null}

      <div className="rounded-2xl border border-dashed border-border/80 p-3">
        {customOpen ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Outro portal</p>
            <FormField label="Nome" htmlFor="oa-custom-label">
              <Input
                id="oa-custom-label"
                value={customLabel}
                onChange={(e: FormChangeEvent) => setCustomLabel(e.target.value)}
                disabled={disabled}
                placeholder="Ex.: e-fatura, Câmara…"
                maxLength={80}
                autoComplete="off"
              />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Utilizador" htmlFor="oa-custom-user">
                <Input
                  id="oa-custom-user"
                  value={customUsername}
                  onChange={(e: FormChangeEvent) => setCustomUsername(e.target.value)}
                  disabled={disabled}
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Palavra-passe" htmlFor="oa-custom-pass">
                <PasswordInput
                  id="oa-custom-pass"
                  value={customPassword}
                  onChange={(e: FormChangeEvent) => setCustomPassword(e.target.value)}
                  disabled={disabled}
                  autoComplete="new-password"
                />
              </FormField>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={disabled || !customLabel.trim() || !customPassword}
                onClick={() => {
                  void requestUnlock({ kind: 'create-custom' })
                }}
              >
                Guardar portal
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setCustomOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => setCustomOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Outro portal (nome à escolha)
          </Button>
        )}
      </div>

      <StepUpPasswordDialog
        open={Boolean(stepUp)}
        mfaEnabled={mfaRequired}
        title={
          stepUp?.kind === 'copy'
            ? 'Copiar senha do portal'
            : stepUp?.kind === 'reveal'
              ? 'Ver senha do portal'
              : stepUp?.kind === 'remove'
                ? 'Remover senha do portal'
                : 'Guardar acesso oficial'
        }
        description={
          mfaRequired
            ? undefined
            : stepUp?.kind === 'copy'
              ? 'A senha vai para a área de transferência e some daqui em cerca de 30 segundos. A consulta fica na auditoria.'
              : stepUp?.kind === 'reveal'
                ? 'A senha fica visível cerca de 30 segundos. Esta consulta fica na auditoria do escritório.'
                : stepUp?.kind === 'remove'
                  ? 'A senha cifrada deste portal é apagada. Confirme com a palavra-passe dos Acessos oficiais.'
                  : 'Confirme a identidade para gravar este acesso. A senha do portal é cifrada antes de ficar guardada.'
        }
        confirmLabel={stepUp?.kind === 'remove' ? 'Remover' : stepUp?.kind === 'copy' ? 'Copiar senha' : 'Confirmar'}
        error={stepUpError}
        onOpenChange={(open) => {
          if (!open) {
            setStepUp(null)
            setPendingDraft(null)
            setStepUpError(null)
          }
        }}
        onConfirm={runStepUp}
      />
    </section>
  )
}
