import { useEffect, useState, type ChangeEvent } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'

import { ClientSearchSelect } from '@/features/firm/components/ClientSearchSelect'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { contabilObligationsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { MAX_UPLOAD_MB, validateUploadFileSize } from '@/shared/utils/uploadLimits'
import type { Client } from '@/shared/types/clients'
import type { ObligationPriority, ObligationType } from '@/shared/types/contabil'
import type { ObligationTemplate } from './obligationOperational'
import {
  currentPeriod,
  dueDateFromPeriod,
  formatEurInputFromCents,
  maskEurInput,
  parseEurToCents,
  PRIORITY_LABELS,
  TYPE_LABELS,
} from './obligationOperational'

type Props = {
  open: boolean
  onClose: () => void
  clients: Client[]
  templates: ObligationTemplate[]
  staff: { id: string; fullName?: string; email?: string }[]
  onCreated: () => void
  initialType?: ObligationType
  initialPeriod?: string
  initialDueDate?: string
}

export function ObligationCreatePanel({
  open,
  onClose,
  clients,
  templates,
  staff,
  onCreated,
  initialType,
  initialPeriod,
  initialDueDate,
}: Props) {
  const [templateId, setTemplateId] = useState('')
  const [clientId, setClientId] = useState('')
  const [type, setType] = useState<ObligationType>('IVA')
  const [period, setPeriod] = useState(currentPeriod())
  const [dueDate, setDueDate] = useState('')
  const [amountEur, setAmountEur] = useState('')
  const [priority, setPriority] = useState<ObligationPriority>('NORMAL')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [accountantNotes, setAccountantNotes] = useState('')
  const [guideFile, setGuideFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [recurring, setRecurring] = useState(false)

  const tpl = templates.find((t) => t.id === templateId || t._id === templateId)

  // Pré-preenchimento vindo do Calendário Fiscal (prazo nacional).
  useEffect(() => {
    if (!open) return
    if (initialType) setType(initialType)
    if (initialPeriod) setPeriod(initialPeriod)
    if (initialDueDate) setDueDate(initialDueDate)
    // Intencional: não mexer em templateId/clientId aqui.
  }, [open, initialType, initialPeriod, initialDueDate])

  useEffect(() => {
    if (!tpl) return
    setType(tpl.type)
    setPriority(tpl.defaultPriority)
    setPeriod(currentPeriod())
    setDueDate(dueDateFromPeriod(period, tpl.defaultDueDay))
    if (tpl.defaultAmountCents != null) setAmountEur(formatEurInputFromCents(tpl.defaultAmountCents))
    if (tpl.defaultTaskDescription) setAccountantNotes(tpl.defaultTaskDescription)
  }, [tpl, period])

  useEffect(() => {
    if (!dueDate && period) setDueDate(dueDateFromPeriod(period, tpl?.defaultDueDay ?? 20))
  }, [period, dueDate, tpl?.defaultDueDay])

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId || !dueDate) {
      toast.error('Selecione o cliente e o prazo')
      return
    }
    if (guideFile) {
      const err = validateUploadFileSize(guideFile)
      if (err) {
        toast.error('Ficheiro demasiado grande', { description: err })
        return
      }
    }
    setSaving(true)
    try {
      const amountCents = parseEurToCents(amountEur)
      if (templateId && !guideFile) {
        await contabilObligationsApi.createFromTemplate({
          templateId,
          clientId,
          period,
          dueDate,
          amountCents: amountCents ?? undefined,
          accountantNotes: accountantNotes || undefined,
          assignedStaffId: assignedStaffId || undefined,
          priority,
        })
        if (recurring) {
          await contabilObligationsApi.createRecurrenceRule({
            templateId,
            clientId,
            frequency: tpl?.recurrenceFrequency === 'NONE' ? 'MONTHLY' : tpl?.recurrenceFrequency,
            nextPeriod: period,
            nextDueDate: dueDate,
            assignedStaffId: assignedStaffId || undefined,
          })
        }
      } else {
        await contabilObligationsApi.create(
          {
            clientId,
            type,
            period,
            dueDate,
            amountCents: amountCents ?? undefined,
            priority,
            accountantNotes: accountantNotes || undefined,
            assignedStaffId: assignedStaffId || undefined,
            createClientTask: true,
          },
          guideFile,
        )
      }
      toast.success('Obrigação criada — cliente notificado')
      onCreated()
      onClose()
    } catch (err) {
      toast.error('Não foi possível criar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="shrink-0 rounded-2xl border border-border/70 bg-muted/20 shadow-sm">
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-brand" />
          Nova obrigação fiscal
        </h3>
        <Button type="button" size="icon" variant="ghost" className="rounded-full" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form onSubmit={submit} className="cb-firm-panel-form-scroll grid gap-3 pb-4 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium">Modelo rápido</span>
          <select
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">Escolher modelo (IVA, SS, SAF-T…) ou manual</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <div className="md:col-span-2">
          <ClientSearchSelect clients={clients} value={clientId} onChange={setClientId} />
        </div>
        {!templateId ? (
          <label className="space-y-1 text-sm">
            <span className="font-medium">Tipo</span>
            <select
              className="flex h-10 w-full rounded-xl border border-input px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as ObligationType)}
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="space-y-1 text-sm">
          <span className="font-medium">Período</span>
          <Input value={period} onChange={(e: FormChangeEvent) => setPeriod(e.target.value)} placeholder="2026-05" required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Prazo</span>
          <Input type="date" value={dueDate} onChange={(e: FormChangeEvent) => setDueDate(e.target.value)} required />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Valor (EUR)</span>
          <Input
            value={amountEur}
            onChange={(e: FormChangeEvent) => setAmountEur(maskEurInput(e.target.value))}
            placeholder="1.250,00"
            inputMode="decimal"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Prioridade</span>
          <select
            className="flex h-10 w-full rounded-xl border border-input px-3 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value as ObligationPriority)}
          >
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Responsável</span>
          <select
            className="flex h-10 w-full rounded-xl border border-input px-3 text-sm"
            value={assignedStaffId}
            onChange={(e) => setAssignedStaffId(e.target.value)}
          >
            <option value="">Sem atribuição</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName || s.email}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Ativar recorrência automática (modelo)
        </label>
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium">Instruções ao cliente</span>
          <Input
            value={accountantNotes}
            onChange={(e: FormChangeEvent) => setAccountantNotes(e.target.value)}
            placeholder="Pagamento, referência, documentos em falta…"
          />
        </label>
        {tpl?.checklist?.length ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background p-3 text-xs md:col-span-2">
            <p className="font-semibold text-muted-foreground">Checklist do modelo</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {tpl.checklist.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium">Guia / documento (opcional)</span>
          <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx" onChange={(e: ChangeEvent<HTMLInputElement>) => setGuideFile(e.target.files?.[0] ?? null)} />
          <p className="text-xs text-muted-foreground">Máx. {MAX_UPLOAD_MB} MB</p>
        </label>
        <div className="md:col-span-2">
          <Button type="submit" className="rounded-full" disabled={saving}>
            {saving ? 'A criar…' : 'Criar obrigação fiscal'}
          </Button>
        </div>
      </form>
    </section>
  )
}
