import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { RichTextEditor, DurationMinutesField, EuroInput } from '@/shared/design-system'
import { IntakeStartModeFields } from '@/features/firm/services/IntakeStartModeFields'
import {
  ServicePaymentMethodsPanel,
  type ServicePaymentMethodId,
} from '@/features/firm/services/ServicePaymentMethodsPanel'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { AccountingService } from '@/shared/types/contabil'
import type { FormChangeEvent } from '@/shared/types/react-events'

type PaymentMethod = ServicePaymentMethodId

type Props = {
  service: AccountingService
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function ServiceEditorSheet({ service, open, onOpenChange, onSaved }: Props) {
  const [name, setName] = useState(service.name)
  const [durationMinutes, setDurationMinutes] = useState(service.durationMinutes)
  const [priceEuros, setPriceEuros] = useState((service.priceCents || 0) / 100)
  const [description, setDescription] = useState(service.description || '')
  const [isActive, setIsActive] = useState(service.isActive !== false)
  const [isPubliclyListed, setIsPubliclyListed] = useState(Boolean(service.isPubliclyListed))
  const [requiresBooking, setRequiresBooking] = useState(Boolean(service.requiresBooking))
  const [intakeStartMode, setIntakeStartMode] = useState<'form' | 'calendar'>(
    service.intakeStartMode === 'calendar' ? 'calendar' : 'form',
  )
  const [slug, setSlug] = useState(service.slug || '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(service.paymentMethod || 'bank_transfer')
  const [paymentRequired, setPaymentRequired] = useState(Boolean(service.paymentRequired))
  const [descOpen, setDescOpen] = useState(Boolean(service.description?.trim()))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(service.name)
    setDurationMinutes(service.durationMinutes)
    setPriceEuros((service.priceCents || 0) / 100)
    setDescription(service.description || '')
    setIsActive(service.isActive !== false)
    setIsPubliclyListed(Boolean(service.isPubliclyListed))
    setRequiresBooking(Boolean(service.requiresBooking))
    setIntakeStartMode(service.intakeStartMode === 'calendar' ? 'calendar' : 'form')
    setSlug(service.slug || '')
    setPaymentMethod(service.paymentMethod || 'bank_transfer')
    setPaymentRequired(Boolean(service.paymentRequired))
    setDescOpen(Boolean(service.description?.trim()))
  }, [open, service])

  const save = async () => {
    if (!name.trim()) {
      toast.error('Indique o nome do serviço')
      return
    }
    setSaving(true)
    try {
      await contabilAccountingServicesApi.patch(service.id, {
        name: name.trim(),
        description: description || null,
        durationMinutes,
        priceEuros,
        isActive,
        isPubliclyListed,
        requiresBooking,
        intakeStartMode: requiresBooking ? intakeStartMode : 'form',
        slug: slug.trim() || null,
        paymentMethod: paymentRequired ? 'stripe_connect' : paymentMethod,
        paymentRequired,
      })
      toast.success('Serviço guardado')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-lg">
        <SheetHiddenTitle>Editar serviço</SheetHiddenTitle>
        <div className="shrink-0 border-b border-border/60 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Editar serviço</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Configure o que o cliente vê e como paga.</p>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sobre o serviço</p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Nome</span>
              <Input value={name} onChange={(e: FormChangeEvent) => setName(e.target.value)} className="rounded-xl" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium">Duração (min)</span>
                <DurationMinutesField value={durationMinutes} onChange={setDurationMinutes} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Preço</span>
                <EuroInput value={priceEuros} onChange={setPriceEuros} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Serviço activo no escritório
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={requiresBooking} onChange={(e) => setRequiresBooking(e.target.checked)} />
              Exige agendamento
            </label>
            <IntakeStartModeFields
              requiresBooking={requiresBooking}
              value={intakeStartMode}
              onChange={setIntakeStartMode}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPubliclyListed}
                onChange={(e) => setIsPubliclyListed(e.target.checked)}
              />
              Público na página do escritório
            </label>
            {isPubliclyListed ? (
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Slug (URL)</span>
                <Input
                  value={slug}
                  onChange={(e: FormChangeEvent) => setSlug(e.target.value)}
                  placeholder="ex.: declaracao-irs-2026"
                  className="rounded-xl font-mono text-xs"
                />
              </label>
            ) : null}
          </section>

          <section className="rounded-xl border border-border/60">
            <button
              type="button"
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
              onClick={() => setDescOpen((v) => !v)}
            >
              <span>Descrição (página pública)</span>
              {descOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>
            {descOpen ? (
              <div className="border-t border-border/50 px-3 py-3">
                <RichTextEditor value={description} onChange={setDescription} placeholder="Texto que o cliente vê…" />
              </div>
            ) : (
              <p className="border-t border-border/40 px-3 py-2 text-xs text-muted-foreground">
                {description?.replace(/<[^>]+>/g, '').trim()
                  ? 'Há texto guardado — abra para editar.'
                  : 'Sem descrição. Abra para escrever o que o cliente vê.'}
              </p>
            )}
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meio de pagamento</p>
            <ServicePaymentMethodsPanel
              paymentMethod={paymentMethod}
              paymentRequired={paymentRequired}
              requiresBooking={requiresBooking}
              onPaymentMethodChange={setPaymentMethod}
              onPaymentRequiredChange={setPaymentRequired}
            />
          </section>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-card px-5 py-3">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" className="rounded-full" disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Guardar serviço
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
