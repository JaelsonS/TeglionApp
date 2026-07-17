import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Crown, KeyRound, Loader2, Save, User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import type { FirmSettingsBundle } from '@/shared/types/firmSettings'
import { getErrorMessage } from '@/shared/utils/errors'
import { authApi } from '@/infrastructure/api'
import { useAuth } from '@/shared/hooks/useAuth'
import { tryNormalizeAuthUser } from '@/shared/utils/authNormalize'
import { PASSWORD_MIN_LENGTH, passwordPolicyMessages } from '@/shared/utils/passwordPolicy'

type Props = {
  bundle: FirmSettingsBundle
  onUpdated: () => void
}

export function FirmSettingsProfileSection({ bundle, onUpdated }: Props) {
  const { setUser } = useAuth()
  const [fullName, setFullName] = useState(bundle.actor.fullName)
  const [email, setEmail] = useState(bundle.actor.email)
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setFullName(bundle.actor.fullName)
    setEmail(bundle.actor.email)
  }, [bundle])

  const onSave = async () => {
    setSaving(true)
    try {
      await firmSettingsApi.patchProfile({
        fullName: fullName.trim(),
        email: email.trim(),
      })
      const me = await authApi.me()
      const normalized = tryNormalizeAuthUser(me?.user)
      if (normalized) setUser(normalized)
      toast.success('O seu perfil foi actualizado.')
      onUpdated()
    } catch (err) {
      toast.error('Não foi possível guardar o perfil', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Preencha a palavra-passe actual e a nova.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('A confirmação não coincide com a nova palavra-passe.')
      return
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      toast.error(passwordPolicyMessages.minLength)
      return
    }
    setSavingPassword(true)
    try {
      await firmSettingsApi.changePassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Palavra-passe actualizada.')
    } catch (err) {
      toast.error('Não foi possível alterar a palavra-passe', { description: getErrorMessage(err) })
    } finally {
      setSavingPassword(false)
    }
  }

  const initials = (bundle.actor.fullName || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')

  return (
    <div className="space-y-4">
      <section className="cb-settings-panel">
        <div className="cb-settings-panel-hd">
          <span className="cb-settings-panel-icon">
            <User className="h-4 w-4" aria-hidden />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                {initials || 'U'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="cb-settings-panel-title">{bundle.actor.fullName}</h3>
                  <span
                    className={
                      bundle.actor.isOwner
                        ? 'cb-settings-role-badge cb-settings-role-badge--owner'
                        : 'cb-settings-role-badge'
                    }
                  >
                    {bundle.actor.isOwner ? <Crown className="h-3 w-3" aria-hidden /> : null}
                    {bundle.actor.firmRoleLabel}
                  </span>
                </div>
                <p className="cb-settings-panel-sub">Nome e e-mail de acesso ao painel do escritório.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/60 px-2 py-1">
                Cargo:{' '}
                {bundle.actor.jobTitle || (bundle.actor.isOwner ? 'Dono do escritório' : 'Colaborador')}
              </span>
              <span className="rounded-full border border-border/60 px-2 py-1">
                Departamento: {bundle.actor.departmentName || 'Sem departamento'}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Nome</Label>
              <Input
                id="profile-name"
                value={fullName}
                onChange={(e: FormChangeEvent) => setFullName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E-mail de acesso</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e: FormChangeEvent) => setEmail(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <Button type="button" className="rounded-lg" disabled={saving} onClick={() => void onSave()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar perfil
          </Button>
        </div>
      </section>

      <section className="cb-settings-panel">
        <div className="cb-settings-panel-hd">
          <span className="cb-settings-panel-icon">
            <KeyRound className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-settings-panel-title">Segurança</h3>
            <p className="cb-settings-panel-sub">
              Altere a palavra-passe desta conta. Mínimo {PASSWORD_MIN_LENGTH} caracteres, com
              maiúscula, minúscula e número.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="current-password">Palavra-passe actual</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e: FormChangeEvent) => setCurrentPassword(e.target.value)}
              disabled={savingPassword}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova palavra-passe</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e: FormChangeEvent) => setNewPassword(e.target.value)}
              disabled={savingPassword}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova palavra-passe</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e: FormChangeEvent) => setConfirmPassword(e.target.value)}
              disabled={savingPassword}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-4 rounded-lg"
          disabled={savingPassword}
          onClick={() => void onChangePassword()}
        >
          {savingPassword ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Actualizar palavra-passe
        </Button>
      </section>
    </div>
  )
}
