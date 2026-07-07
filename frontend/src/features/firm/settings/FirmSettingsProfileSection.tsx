import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Crown, Loader2, Save, User } from 'lucide-react'
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

type Props = {
  bundle: FirmSettingsBundle
  onUpdated: () => void
}

export function FirmSettingsProfileSection({ bundle, onUpdated }: Props) {
  const { setUser } = useAuth()
  const [fullName, setFullName] = useState(bundle.actor.fullName)
  const [email, setEmail] = useState(bundle.actor.email)
  const [saving, setSaving] = useState(false)

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

  return (
    <section id="perfil" className="cb-settings-panel scroll-mt-24">
      <div className="cb-settings-panel-hd">
        <span className="cb-settings-panel-icon">
          <User className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="cb-settings-panel-title">O seu perfil</h2>
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
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border/60 px-2 py-1">
              Cargo: {bundle.actor.jobTitle || (bundle.actor.isOwner ? 'Dono do escritório' : 'Colaborador')}
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
        <Button type="button" variant="outline" className="rounded-lg" disabled={saving} onClick={() => void onSave()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar perfil
        </Button>
      </div>
    </section>
  )
}
