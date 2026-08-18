import { useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Copy, ExternalLink, Eye, EyeOff, KeyRound, Plus, Shield, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { StepUpPasswordDialog } from '@/features/firm/client-hub/StepUpPasswordDialog'
import type { OfficialAccessItem } from '@/features/firm/client-hub/officialAccesses.types'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { FormField, ProfileSectionCard, Skeleton } from '@/shared/design-system'
import {
  useOfficialAccesses,
  useRemoveOfficialAccess,
  useRevealOfficialAccess,
  useUpsertOfficialAccess,
} from '@/shared/hooks/queries/useOfficialAccesses'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'

type StepUpIntent =
  | { kind: 'save'; item: OfficialAccessItem }
  | { kind: 'reveal'; item: OfficialAccessItem }
  | { kind: 'remove'; item: OfficialAccessItem }
  | { kind: 'create-custom' }

type Draft = { username: string; password: string; label: string }

function emptyDraft(item: OfficialAccessItem): Draft {
  return {
    username: item.username || '',
    password: '',
    label: item.label || '',
  }
}

function PortalCard({
  item,
  disabled,
  revealTtl,
  revealedPassword,
  onSave,
  onReveal,
  onHide,
  onRemove,
}: {
  item: OfficialAccessItem
  disabled: boolean
  revealTtl: number
  revealedPassword: string | null
  onSave: (item: OfficialAccessItem, draft: Draft) => void
  onReveal: (item: OfficialAccessItem) => void
  onHide: () => void
  onRemove: (item: OfficialAccessItem) => void
}) {
  const [draft, setDraft] = useState(() => emptyDraft(item))
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    setDraft(emptyDraft(item))
  }, [item.id, item.username, item.hasPassword, item.updatedAt, item.label])

  useEffect(() => {
    if (!revealedPassword) {
      setSecondsLeft(0)
      return undefined
    }
    setSecondsLeft(revealTtl)
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(tick)
  }, [revealedPassword, revealTtl])

  const dirty = useMemo(() => {
    const usernameChanged = draft.username.trim() !== (item.username || '')
    const labelChanged = item.portalKey === 'CUSTOM' && draft.label.trim() !== (item.label || '')
    return usernameChanged || Boolean(draft.password) || labelChanged
  }, [draft, item])

  const fieldId = item.id || item.portalKey

  return (
    <ProfileSectionCard title={item.title} description={item.description}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Abrir portal
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : (
          <span />
        )}
        {item.updatedAt ? (
          <span className="text-caption text-muted-foreground">Actualizado {formatDateTime(item.updatedAt)}</span>
        ) : null}
      </div>

      {item.portalKey === 'CUSTOM' ? (
        <FormField label="Nome do portal" htmlFor={`oa-label-${fieldId}`}>
          <Input
            id={`oa-label-${fieldId}`}
            value={draft.label}
            onChange={(e: FormChangeEvent) => setDraft((d) => ({ ...d, label: e.target.value }))}
            disabled={disabled}
            maxLength={80}
            autoComplete="off"
          />
        </FormField>
      ) : null}

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

      <div className="space-y-2">
        <p className="cb-field-label text-caption font-medium text-foreground">Palavra-passe do portal</p>
        {item.hasPassword ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Input
                readOnly
                value={revealedPassword ?? '••••••••••••'}
                type={revealedPassword ? 'text' : 'password'}
                autoComplete="off"
                className="pr-10 font-mono tracking-wide"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                aria-label={revealedPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                disabled={disabled}
                onClick={() => {
                  if (revealedPassword) {
                    onHide()
                    return
                  }
                  onReveal(item)
                }}
              >
                {revealedPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || !revealedPassword}
              onClick={async () => {
                if (!revealedPassword) return
                await navigator.clipboard.writeText(revealedPassword)
                toast.success('Copiada', {
                  description: `Oculta-se automaticamente daqui a ${secondsLeft || revealTtl}s.`,
                })
              }}
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Copiar
            </Button>
            {revealedPassword ? (
              <span className="text-caption text-muted-foreground">Visível {secondsLeft}s</span>
            ) : (
              <span className="text-caption text-muted-foreground">O olho pede a sua palavra-passe do Teglion</span>
            )}
          </div>
        ) : (
          <p className="text-caption text-muted-foreground">Ainda não há senha guardada neste portal.</p>
        )}
        <FormField
          label={item.hasPassword ? 'Substituir palavra-passe' : 'Palavra-passe'}
          hint={item.hasPassword ? 'Deixe em branco para manter a senha actual.' : undefined}
          htmlFor={`oa-pass-${fieldId}`}
        >
          <PasswordInput
            id={`oa-pass-${fieldId}`}
            value={draft.password}
            onChange={(e: FormChangeEvent) => setDraft((d) => ({ ...d, password: e.target.value }))}
            disabled={disabled}
            autoComplete="new-password"
            placeholder={item.hasPassword ? 'Nova senha (opcional)' : 'Senha do portal'}
          />
        </FormField>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
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
    </ProfileSectionCard>
  )
}

export function ClientHubOfficialAccessesPanel({ clientId }: { clientId: string }) {
  const { data, isLoading, isError, refetch } = useOfficialAccesses(clientId)
  const upsert = useUpsertOfficialAccess(clientId)
  const reveal = useRevealOfficialAccess(clientId)
  const remove = useRemoveOfficialAccess(clientId)
  const [stepUp, setStepUp] = useState<StepUpIntent | null>(null)
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null)
  const [customLabel, setCustomLabel] = useState('')
  const [customUsername, setCustomUsername] = useState('')
  const [customPassword, setCustomPassword] = useState('')
  const [stepUpError, setStepUpError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<{ accessId: string; value: string } | null>(null)

  const items = data?.items || []
  const security = data?.security
  const revealTtl = security?.revealTtlSeconds || 30
  const disabled = !security?.hasLocalPassword || upsert.isPending || remove.isPending

  useEffect(() => {
    if (!revealed) return undefined
    const timer = window.setTimeout(() => setRevealed(null), revealTtl * 1000)
    return () => window.clearTimeout(timer)
  }, [revealed, revealTtl])

  function requestSave(item: OfficialAccessItem, draft: Draft) {
    if (!item.id && !draft.password.trim()) {
      toast.error('Indique a palavra-passe deste portal para gravar.')
      return
    }
    setPendingDraft(draft)
    setStepUpError(null)
    setStepUp({ kind: 'save', item })
  }

  async function runStepUp(currentPassword: string) {
    if (!stepUp) return
    try {
      if (stepUp.kind === 'save' && pendingDraft) {
        await upsert.mutateAsync({
          currentPassword,
          portalKey: stepUp.item.portalKey,
          accessId: stepUp.item.id,
          username: pendingDraft.username,
          password: pendingDraft.password || undefined,
          label: stepUp.item.portalKey === 'CUSTOM' ? pendingDraft.label : undefined,
        })
      } else if (stepUp.kind === 'create-custom') {
        await upsert.mutateAsync({
          currentPassword,
          portalKey: 'CUSTOM',
          label: customLabel,
          username: customUsername,
          password: customPassword,
        })
        setCustomLabel('')
        setCustomUsername('')
        setCustomPassword('')
      } else if (stepUp.kind === 'reveal' && stepUp.item.id) {
        const result = await reveal.mutateAsync({
          accessId: stepUp.item.id,
          currentPassword,
        })
        setRevealed({ accessId: stepUp.item.id, value: result.revealedValue })
      } else if (stepUp.kind === 'remove' && stepUp.item.id) {
        await remove.mutateAsync({ accessId: stepUp.item.id, currentPassword })
        if (revealed?.accessId === stepUp.item.id) setRevealed(null)
      }
      setStepUp(null)
      setPendingDraft(null)
      setStepUpError(null)
    } catch (err) {
      setStepUpError(getErrorMessage(err))
    }
  }

  return (
    <section className="cb-client-hub-panel space-y-4 p-4 sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <KeyRound className="h-4 w-4 text-primary" aria-hidden />
          Acessos oficiais
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AT, Segurança Social, ViaCTT, IAPMEI e Relatório Único. As senhas ficam cifradas no servidor e só a
          equipa do escritório as vê — o cliente no portal não tem este bloco. Ver uma senha pede sempre a sua
          palavra-passe do Teglion e fica na auditoria.
        </p>
      </div>

      {security && !security.hasLocalPassword ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            A sua conta não tem palavra-passe no Teglion (por exemplo, entrou só com Google). Sem essa
            palavra-passe o Teglion não consegue confirmar que é mesmo você ao ver ou gravar senhas de
            portais. Use uma conta com e-mail e palavra-passe, ou peça ao dono do escritório para definir
            uma.
          </p>
        </div>
      ) : null}

      {isLoading ? <Skeleton className="h-48 w-full rounded-xl" /> : null}
      {isError ? (
        <div className="rounded-xl border border-border/70 p-4">
          <p className="text-sm text-muted-foreground">Não foi possível carregar os acessos oficiais.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : null}

      {items.map((item) => (
        <PortalCard
          key={`${item.portalKey}-${item.id || 'empty'}`}
          item={item}
          disabled={disabled}
          revealTtl={revealTtl}
          revealedPassword={item.id && revealed?.accessId === item.id ? revealed.value : null}
          onSave={requestSave}
          onReveal={(target) => {
            setStepUpError(null)
            setStepUp({ kind: 'reveal', item: target })
          }}
          onHide={() => setRevealed(null)}
          onRemove={(target) => {
            setStepUpError(null)
            setStepUp({ kind: 'remove', item: target })
          }}
        />
      ))}

      <ProfileSectionCard title="Outro portal" description="Para um acesso oficial que não está na lista.">
        <FormField label="Nome do portal" htmlFor="oa-custom-label">
          <Input
            id="oa-custom-label"
            value={customLabel}
            onChange={(e: FormChangeEvent) => setCustomLabel(e.target.value)}
            disabled={disabled}
            placeholder="Ex.: e-fatura…"
            maxLength={80}
            autoComplete="off"
          />
        </FormField>
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || !customLabel.trim() || !customPassword}
          onClick={() => {
            setStepUpError(null)
            setStepUp({ kind: 'create-custom' })
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Adicionar portal
        </Button>
      </ProfileSectionCard>

      <StepUpPasswordDialog
        open={Boolean(stepUp)}
        title={
          stepUp?.kind === 'reveal'
            ? 'Ver senha do portal'
            : stepUp?.kind === 'remove'
              ? 'Remover senha do portal'
              : 'Guardar acesso oficial'
        }
        description={
          stepUp?.kind === 'reveal'
            ? 'A senha fica visível cerca de 30 segundos. Esta consulta fica registada na auditoria do escritório.'
            : stepUp?.kind === 'remove'
              ? 'A senha cifrada deste portal é apagada. Confirme com a sua palavra-passe do Teglion.'
              : 'Confirme a sua identidade para gravar este acesso. A senha do portal é cifrada antes de ficar guardada.'
        }
        confirmLabel={stepUp?.kind === 'remove' ? 'Remover' : 'Confirmar'}
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
