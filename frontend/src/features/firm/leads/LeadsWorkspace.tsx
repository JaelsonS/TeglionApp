import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { contabilLeadsApi, contabilServiceInquiriesApi, contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'DISMISSED'
type InquiryStatus = 'NEW' | 'CONTACTED' | 'DOCS_REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  taxId: string | null
  status: LeadStatus
  createdAt: string
}

type ServiceInquiry = {
  id: string
  serviceId: string
  status: InquiryStatus
  notes: string | null
  createdAt: string
}

type AccountingServiceOption = { id: string; name: string }

const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Qualificado',
  CONVERTED: 'Convertido',
  DISMISSED: 'Descartado',
}

const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contactado',
  DOCS_REQUESTED: 'Documentos pedidos',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const LEAD_STATUS_OPTIONS: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISMISSED']
const INQUIRY_STATUS_OPTIONS: InquiryStatus[] = ['NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--cb-bg,#FAFAF7)] px-2 py-0.5 text-xs font-medium text-[var(--cb-text-muted,#4A5568)] ring-1 ring-inset ring-black/10">
      {label}
    </span>
  )
}

export function LeadsWorkspace() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [services, setServices] = useState<AccountingServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([])
  const [inquiriesLoading, setInquiriesLoading] = useState(false)

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [creating, setCreating] = useState(false)

  const [newInquiryServiceId, setNewInquiryServiceId] = useState('')
  const [creatingInquiry, setCreatingInquiry] = useState(false)
  const [converting, setConverting] = useState(false)

  const selectedLead = useMemo(() => leads.find((l) => l.id === selectedLeadId) || null, [leads, selectedLeadId])

  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const { items } = await contabilLeadsApi.list()
      setLeads(items || [])
    } catch (err) {
      toast.error('Erro ao carregar leads', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadServices = useCallback(async () => {
    try {
      const { items } = await contabilAccountingServicesApi.list({ activeOnly: true })
      setServices((items || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
    } catch (err) {
      toast.error('Erro ao carregar serviços', { description: getErrorMessage(err) })
    }
  }, [])

  useEffect(() => {
    void loadLeads()
    void loadServices()
  }, [loadLeads, loadServices])

  const loadInquiries = useCallback(async (leadId: string) => {
    setInquiriesLoading(true)
    try {
      const { items } = await contabilServiceInquiriesApi.list()
      setInquiries((items || []).filter((i: ServiceInquiry & { leadId?: string }) => i.leadId === leadId))
    } catch (err) {
      toast.error('Erro ao carregar solicitações', { description: getErrorMessage(err) })
    } finally {
      setInquiriesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedLeadId) void loadInquiries(selectedLeadId)
    else setInquiries([])
  }, [selectedLeadId, loadInquiries])

  async function handleCreateLead() {
    if (!newName.trim()) {
      toast.error('Indique o nome')
      return
    }
    if (!newEmail.trim() && !newPhone.trim()) {
      toast.error('Indique email ou telefone')
      return
    }
    setCreating(true)
    try {
      const { lead, reused } = await contabilLeadsApi.create({
        name: newName.trim(),
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
      })
      toast.success(reused ? 'Já existia um lead com este contacto — reaproveitado' : 'Lead criado')
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      await loadLeads()
      setSelectedLeadId(lead.id)
    } catch (err) {
      const status = (err as { response?: { status?: number }; statusCode?: number })?.response?.status
      if (status === 409) {
        toast.error('Já existe um cliente com este email/NIF', {
          description: 'Crie a solicitação directamente na ficha do cliente.',
        })
      } else {
        toast.error('Erro ao criar lead', { description: getErrorMessage(err) })
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleLeadStatusChange(status: LeadStatus) {
    if (!selectedLead) return
    try {
      await contabilLeadsApi.patch(selectedLead.id, { status })
      toast.success('Estado actualizado')
      await loadLeads()
    } catch (err) {
      toast.error('Erro ao actualizar estado', { description: getErrorMessage(err) })
    }
  }

  async function handleConvert() {
    if (!selectedLead) return
    setConverting(true)
    try {
      const { client } = await contabilLeadsApi.convertToClient(selectedLead.id)
      toast.success(`Convertido em cliente: ${client.displayName || client.name || ''}`)
      await loadLeads()
    } catch (err) {
      toast.error('Erro ao converter em cliente', { description: getErrorMessage(err) })
    } finally {
      setConverting(false)
    }
  }

  async function handleCreateInquiry() {
    if (!selectedLead || !newInquiryServiceId) {
      toast.error('Seleccione um serviço')
      return
    }
    setCreatingInquiry(true)
    try {
      await contabilServiceInquiriesApi.create({ serviceId: newInquiryServiceId, leadId: selectedLead.id })
      toast.success('Solicitação criada')
      setNewInquiryServiceId('')
      await loadInquiries(selectedLead.id)
    } catch (err) {
      toast.error('Erro ao criar solicitação', { description: getErrorMessage(err) })
    } finally {
      setCreatingInquiry(false)
    }
  }

  async function handleInquiryStatusChange(inquiryId: string, status: InquiryStatus) {
    try {
      await contabilServiceInquiriesApi.patch(inquiryId, { status })
      toast.success('Estado actualizado')
      if (selectedLead) await loadInquiries(selectedLead.id)
    } catch (err) {
      toast.error('Erro ao actualizar estado', { description: getErrorMessage(err) })
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 gap-4 overflow-hidden">
      <div className="flex w-full max-w-sm flex-col gap-3 overflow-hidden border-r border-black/10 pr-4">
        <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-3">
          <p className="text-sm font-medium">Novo lead</p>
          <Input placeholder="Nome" value={newName} onChange={(e: FormChangeEvent) => setNewName(e.target.value)} />
          <Input placeholder="Email" value={newEmail} onChange={(e: FormChangeEvent) => setNewEmail(e.target.value)} />
          <Input placeholder="Telefone" value={newPhone} onChange={(e: FormChangeEvent) => setNewPhone(e.target.value)} />
          <Button size="sm" disabled={creating} onClick={() => void handleCreateLead()}>
            {creating ? 'A criar…' : 'Criar lead'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="p-3 text-sm text-[var(--cb-text-muted,#4A5568)]">A carregar…</p>
          ) : leads.length === 0 ? (
            <p className="p-3 text-sm text-[var(--cb-text-muted,#4A5568)]">Sem leads ainda.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {leads.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`flex w-full flex-col items-start gap-1 rounded-lg border p-2 text-left text-sm transition ${
                      selectedLeadId === lead.id ? 'border-[var(--cb-accent,#C9932E)] bg-black/5' : 'border-transparent hover:bg-black/5'
                    }`}
                  >
                    <span className="font-medium">{lead.name}</span>
                    <span className="text-xs text-[var(--cb-text-muted,#4A5568)]">{lead.email || lead.phone}</span>
                    <StatusBadge label={LEAD_STATUS_LABEL[lead.status]} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {!selectedLead ? (
          <p className="p-4 text-sm text-[var(--cb-text-muted,#4A5568)]">Seleccione um lead para ver detalhe.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{selectedLead.name}</h3>
                <StatusBadge label={LEAD_STATUS_LABEL[selectedLead.status]} />
              </div>
              <p className="text-sm text-[var(--cb-text-muted,#4A5568)]">
                {selectedLead.email} {selectedLead.phone ? `· ${selectedLead.phone}` : ''}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {LEAD_STATUS_OPTIONS.filter((s) => s !== selectedLead.status).map((s) => (
                  <Button key={s} size="sm" variant="outline" onClick={() => void handleLeadStatusChange(s)}>
                    Marcar {LEAD_STATUS_LABEL[s]}
                  </Button>
                ))}
                {selectedLead.status !== 'CONVERTED' && selectedLead.status !== 'DISMISSED' && (
                  <Button size="sm" disabled={converting} onClick={() => void handleConvert()}>
                    {converting ? 'A converter…' : 'Converter em cliente'}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-4">
              <p className="text-sm font-medium">Nova solicitação de serviço</p>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-black/10 px-2 py-1 text-sm"
                  value={newInquiryServiceId}
                  onChange={(e) => setNewInquiryServiceId(e.target.value)}
                >
                  <option value="">Seleccione um serviço…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" disabled={creatingInquiry} onClick={() => void handleCreateInquiry()}>
                  {creatingInquiry ? 'A criar…' : 'Criar'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Solicitações deste lead</p>
              {inquiriesLoading ? (
                <p className="text-sm text-[var(--cb-text-muted,#4A5568)]">A carregar…</p>
              ) : inquiries.length === 0 ? (
                <p className="text-sm text-[var(--cb-text-muted,#4A5568)]">Nenhuma solicitação ainda.</p>
              ) : (
                inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="flex flex-col gap-2 rounded-lg border border-black/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {services.find((s) => s.id === inquiry.serviceId)?.name || inquiry.serviceId}
                      </span>
                      <StatusBadge label={INQUIRY_STATUS_LABEL[inquiry.status]} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {INQUIRY_STATUS_OPTIONS.filter((s) => s !== inquiry.status).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          onClick={() => void handleInquiryStatusChange(inquiry.id, s)}
                        >
                          {INQUIRY_STATUS_LABEL[s]}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
