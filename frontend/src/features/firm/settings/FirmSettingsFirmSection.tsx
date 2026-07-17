import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Building2, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import type { FirmSettingsBundle } from '@/shared/types/firmSettings'
import { getErrorMessage } from '@/shared/utils/errors'
import { emitAppDataChanged } from '@/shared/utils/appEvents'

type Props = {
  bundle: FirmSettingsBundle
  onUpdated: () => void
}

export function FirmSettingsFirmSection({ bundle, onUpdated }: Props) {
  const canEdit = bundle.capabilities.canEditFirm
  const [name, setName] = useState(bundle.firm.name)
  const [contactEmail, setContactEmail] = useState(bundle.contact.email ?? '')
  const [contactPhone, setContactPhone] = useState(bundle.contact.phone ?? '')
  const [taxId, setTaxId] = useState(bundle.contact.taxId ?? '')
  const [address, setAddress] = useState(bundle.contact.address ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(bundle.firm.name)
    setContactEmail(bundle.contact.email ?? '')
    setContactPhone(bundle.contact.phone ?? '')
    setTaxId(bundle.contact.taxId ?? '')
    setAddress(bundle.contact.address ?? '')
  }, [bundle])

  const onSave = async () => {
    if (!canEdit) return
    setSaving(true)
    try {
      await firmSettingsApi.patchFirm({
        name: name.trim(),
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        taxId: taxId.trim() || null,
        address: address.trim() || null,
      })
      emitAppDataChanged({ scope: 'branding' })
      toast.success('Dados do escritório guardados.')
      onUpdated()
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="escritorio" className="cb-settings-panel scroll-mt-24">
      <div className="cb-settings-panel-hd">
        <span className="cb-settings-panel-icon">
          <Building2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="cb-settings-panel-title">Dados do escritório</h2>
          <p className="cb-settings-panel-sub">
            {canEdit
              ? 'Nome e contactos visíveis na subscrição e comunicações internas.'
              : 'Apenas o dono do escritório pode editar estes campos.'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firm-name">Nome do escritório</Label>
          <Input
            id="firm-name"
            value={name}
            onChange={(e: FormChangeEvent) => setName(e.target.value)}
            disabled={!canEdit || saving}
            placeholder="Ex.: MFContabil"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firm-contact-email">E-mail de contacto</Label>
            <Input
              id="firm-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e: FormChangeEvent) => setContactEmail(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="contabilidade@empresa.pt"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firm-phone">Telefone</Label>
            <Input
              id="firm-phone"
              value={contactPhone}
              onChange={(e: FormChangeEvent) => setContactPhone(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="+351 …"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firm-nif">NIF (opcional)</Label>
            <Input
              id="firm-nif"
              value={taxId}
              onChange={(e: FormChangeEvent) => setTaxId(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="NIF do escritório"
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="firm-address">Morada (opcional)</Label>
            <Input
              id="firm-address"
              value={address}
              onChange={(e: FormChangeEvent) => setAddress(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="Rua, cidade"
            />
          </div>
        </div>
        {bundle.firm.status ? (
          <p className="inline-flex items-center rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground">
            Estado:{' '}
            <strong className="ml-1 text-foreground">
              {bundle.firm.status === 'ACTIVE' || bundle.firm.status === 'TRIAL'
                ? 'Escritório activo'
                : bundle.firm.status}
            </strong>
            {bundle.firm.trialEndsAt
              ? ` · teste até ${new Date(bundle.firm.trialEndsAt).toLocaleDateString('pt-PT')}`
              : null}
          </p>
        ) : null}
        {canEdit ? (
          <Button type="button" className="cb-btn-primary" disabled={saving} onClick={() => void onSave()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar dados do escritório
          </Button>
        ) : null}
      </div>
    </section>
  )
}
