import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

import { ClientHubAddressSection } from '@/features/firm/client-hub/ClientHubAddressSection'
import { ClientHubServicesSection } from '@/features/firm/client-hub/ClientHubServicesSection'
import { InlineEditField } from '@/features/firm/client-hub/InlineEditField'
import { InlineEditSelect } from '@/features/firm/client-hub/InlineEditSelect'
import { CaeComboboxField } from '@/features/firm/components/CaeCombobox'
import {
  ACCOUNTING_TYPES,
  IRS_FRAMEWORKS,
  VAT_EXEMPTION_REASONS,
  VAT_REGIMES,
  YES_NO_OPTIONS,
} from '@/features/firm/components/companyCreateConstants'
import {
  getClientTypeOptions,
  normalizeClientType,
} from '@/features/firm/components/clientRegistrationConfig'
import type { ClientFiscalProfile, ClientHubResponse } from '@/infrastructure/api/contabil/types'
import type { ClientPatchPayload } from '@/shared/hooks/queries/useClientHub'
import { ProfileSectionCard } from '@/shared/design-system'
import { useDebouncedCallback } from '@/shared/hooks/useDebouncedCallback'
import { contabilFirmApi } from '@/infrastructure/api'
import { useTranslation } from 'react-i18next'

type Props = {
  hub: ClientHubResponse
  onPatch: (payload: ClientPatchPayload) => void
  isSaving: boolean
}

const accountingTypeOptions = ACCOUNTING_TYPES.map((v) => ({ value: v, label: v }))
const vatOptions = VAT_REGIMES.map((v) => ({ value: v, label: v }))
const vatExemptionOptions = VAT_EXEMPTION_REASONS.map((v) => ({ value: v, label: v }))
const irsOptions = IRS_FRAMEWORKS.map((v) => ({ value: v, label: v }))

export function ClientHubProfilePanel({ hub, onPatch, isSaving }: Props) {
  const { t } = useTranslation('common')
  const { client } = hub
  const fp = client.fiscalProfile
  const contact = fp.contacts?.[0] || {}
  const clientTypeOptions = getClientTypeOptions(t)
  const normalizedClientType = normalizeClientType(fp.clientType)
  const isIndividualClient = normalizedClientType === 'INDIVIDUAL'

  const { data: staffData } = useQuery({
    queryKey: ['firm-staff', 'hub'],
    queryFn: () => contabilFirmApi.listStaff(),
    staleTime: 120_000,
  })
  const staff =
    (staffData as { items?: { id: string; fullName?: string; email?: string }[] })?.items || []
  const staffOptions = staff.map((u) => ({
    value: u.id,
    label: u.fullName || u.email || u.id,
  }))

  const debouncedMeta = useDebouncedCallback((metadata: Partial<ClientFiscalProfile>) => {
    onPatch({ metadata })
  }, 700)

  const debouncedScalar = useDebouncedCallback((payload: ClientPatchPayload) => {
    onPatch(payload)
  }, 600)

  const saveMetaField = useCallback(
    (key: keyof ClientFiscalProfile, value: string) => {
      if (key === 'clientType') {
        debouncedMeta({
          clientType: normalizeClientType(value as Parameters<typeof normalizeClientType>[0]),
        } as Partial<ClientFiscalProfile>)
        return
      }
      debouncedMeta({ [key]: value || null } as Partial<ClientFiscalProfile>)
    },
    [debouncedMeta],
  )

  const saveSocialSecurityField = useCallback(
    (key: 'area' | 'oneYearExemption' | 'startDate' | 'quarterlyDeclaration', value: string) => {
      debouncedMeta({
        socialSecurity: {
          area: key === 'area' ? value || null : fp.socialSecurity?.area || null,
          oneYearExemption:
            key === 'oneYearExemption'
              ? value === 'Sim'
                ? true
                : value === 'Não'
                  ? false
                  : null
              : fp.socialSecurity?.oneYearExemption ?? null,
          startDate: key === 'startDate' ? value || null : fp.socialSecurity?.startDate || null,
          quarterlyDeclaration:
            key === 'quarterlyDeclaration'
              ? value === 'Sim'
                ? true
                : value === 'Não'
                  ? false
                  : null
              : fp.socialSecurity?.quarterlyDeclaration ?? null,
        },
      })
    },
    [debouncedMeta, fp.socialSecurity],
  )

  const saveIdentificationField = useCallback(
    (key: 'spouse' | 'irsDelivery' | 'validateEInvoice' | 'communicateHousehold', value: string) => {
      debouncedMeta({
        identification: {
          spouse:
            key === 'spouse'
              ? value === 'Sim'
                ? true
                : value === 'Não'
                  ? false
                  : null
              : fp.identification?.spouse ?? null,
          irsDelivery:
            key === 'irsDelivery'
              ? value === 'Sim'
                ? true
                : value === 'Não'
                  ? false
                  : null
              : fp.identification?.irsDelivery ?? null,
          validateEInvoice:
            key === 'validateEInvoice'
              ? value === 'Sim'
                ? true
                : value === 'Não'
                  ? false
                  : null
              : fp.identification?.validateEInvoice ?? null,
          communicateHousehold:
            key === 'communicateHousehold'
              ? value === 'Sim'
                ? true
                : value === 'Não'
                  ? false
                  : null
              : fp.identification?.communicateHousehold ?? null,
        },
      })
    },
    [debouncedMeta, fp.identification],
  )

  const saveContact = useCallback(
    (patch: Partial<{ name: string; role: string; email: string; phone: string }>) => {
      const next = {
        name: patch.name ?? contact.name ?? '',
        role: patch.role ?? contact.role ?? '',
        email: patch.email ?? contact.email ?? '',
        phone: patch.phone ?? contact.phone ?? '',
      }
      const hasAny = next.name || next.role || next.email || next.phone
      debouncedMeta({
        contacts: hasAny
          ? [
            {
              name: next.name || null,
              role: next.role || null,
              email: next.email || null,
              phone: next.phone || null,
            },
          ]
          : [],
      })
    },
    [contact, debouncedMeta],
  )

  const onStaffChange = (staffId: string) => {
    const member = staff.find((u) => u.id === staffId)
    onPatch({
      assignedStaffId: staffId || undefined,
      metadata: {
        assignedStaffLabel: member?.fullName || member?.email || null,
      },
    })
  }

  return (
    <div className="cb-client-hub-profile space-y-6">
      <p className="text-sm text-muted-foreground">
        Os mesmos dados do registo de empresa — edite inline; as alterações guardam automaticamente.
      </p>

      <div className="grid gap-6 xl:grid-cols-2">
        <ProfileSectionCard title="Identificação" description="Passo 1 do registo">
          <InlineEditSelect
            label="Tipo de cliente"
            value={normalizedClientType}
            options={clientTypeOptions}
            saving={isSaving}
            onSave={(v) => saveMetaField('clientType', v)}
          />
          <InlineEditField
            label="Nome comercial"
            value={client.displayName || client.name || ''}
            saving={isSaving}
            onSave={(v) => debouncedScalar({ displayName: v })}
          />
          <InlineEditField
            label={isIndividualClient ? 'Nome do cliente' : 'Designação social'}
            value={fp.legalName || ''}
            saving={isSaving}
            placeholder={isIndividualClient ? 'Ex.: João Silva' : 'Ex.: Empresa Exemplo, Lda.'}
            onSave={(v) => saveMetaField('legalName', v)}
          />
          <InlineEditField
            label="NIF"
            value={client.taxId || ''}
            saving={isSaving}
            onSave={(v) => debouncedScalar({ taxId: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <InlineEditField
              label="Início de atividade"
              value={fp.activityStartDate || ''}
              saving={isSaving}
              placeholder="AAAA-MM-DD"
              onSave={(v) => saveMetaField('activityStartDate', v)}
            />
            <InlineEditField
              label="Capital social"
              value={fp.shareCapital || ''}
              saving={isSaving}
              onSave={(v) => saveMetaField('shareCapital', v)}
            />
          </div>
          <ClientHubAddressSection
            address={fp.address}
            saving={isSaving}
            onSave={(addr) => debouncedMeta({ address: addr })}
          />
        </ProfileSectionCard>

        <ProfileSectionCard title="Enquadramento fiscal" description="Passo 2 do registo">
          <InlineEditSelect
            label="Tipo de contabilidade"
            value={fp.accountingType || ''}
            options={accountingTypeOptions}
            saving={isSaving}
            onSave={(v) => saveMetaField('accountingType', v)}
          />
          <CaeComboboxField
            label="CAE principal"
            value={fp.caePrimary || ''}
            saving={isSaving}
            placeholder="Pesquisar ou escrever CAE principal…"
            onSave={(v) => {
              // Guardar de imediato — debounce perdia o valor ao sair da ficha
              onPatch({ metadata: { caePrimary: v.trim() || null } })
            }}
          />
          {[0, 1].map((i) => (
            <CaeComboboxField
              key={i}
              label={i === 0 ? 'CAE secundário' : 'CAE secundário (2)'}
              value={fp.caeSecondary[i] || ''}
              saving={isSaving}
              placeholder="Pesquisar ou escrever CAE secundário…"
              onSave={(v) => {
                const next = [...(fp.caeSecondary || [])]
                while (next.length <= i) next.push('')
                next[i] = v
                onPatch({
                  metadata: {
                    caeSecondary: next.map((s) => s.trim()).filter(Boolean),
                  },
                })
              }}
            />
          ))}
          <InlineEditSelect
            label="Regime de IVA"
            value={fp.vatRegime || ''}
            options={vatOptions}
            saving={isSaving}
            onSave={(v) => saveMetaField('vatRegime', v)}
          />
          {fp.vatRegime === 'Isento' ? (
            <InlineEditSelect
              label="Motivo da isenção"
              value={fp.vatExemptionReason || ''}
              options={vatExemptionOptions}
              saving={isSaving}
              onSave={(v) => saveMetaField('vatExemptionReason', v)}
            />
          ) : null}
          <InlineEditSelect
            label="Enquadramento IRS / IRC"
            value={fp.irsFramework || ''}
            options={irsOptions}
            saving={isSaving}
            onSave={(v) => saveMetaField('irsFramework', v)}
          />
          <InlineEditField
            label="Área da Segurança Social"
            value={fp.socialSecurity?.area || ''}
            saving={isSaving}
            onSave={(v) => saveSocialSecurityField('area', v)}
          />
          <InlineEditSelect
            label="Isenção de 1 ano"
            value={fp.socialSecurity?.oneYearExemption === true ? 'Sim' : fp.socialSecurity?.oneYearExemption === false ? 'Não' : ''}
            options={YES_NO_OPTIONS.map((v) => ({ value: v, label: v }))}
            saving={isSaving}
            onSave={(v) => saveSocialSecurityField('oneYearExemption', v)}
          />
          <InlineEditField
            label="Data de início"
            value={fp.socialSecurity?.startDate || ''}
            saving={isSaving}
            placeholder="AAAA-MM-DD"
            onSave={(v) => saveSocialSecurityField('startDate', v)}
          />
          <InlineEditSelect
            label="Entrega da declaração trimestral"
            value={
              fp.socialSecurity?.quarterlyDeclaration === true
                ? 'Sim'
                : fp.socialSecurity?.quarterlyDeclaration === false
                  ? 'Não'
                  : ''
            }
            options={YES_NO_OPTIONS.map((v) => ({ value: v, label: v }))}
            saving={isSaving}
            onSave={(v) => saveSocialSecurityField('quarterlyDeclaration', v)}
          />
          <InlineEditSelect
            label="Cônjuge"
            value={fp.identification?.spouse === true ? 'Sim' : fp.identification?.spouse === false ? 'Não' : ''}
            options={YES_NO_OPTIONS.map((v) => ({ value: v, label: v }))}
            saving={isSaving}
            onSave={(v) => saveIdentificationField('spouse', v)}
          />
          <InlineEditSelect
            label="Entrega de IRS"
            value={fp.identification?.irsDelivery === true ? 'Sim' : fp.identification?.irsDelivery === false ? 'Não' : ''}
            options={YES_NO_OPTIONS.map((v) => ({ value: v, label: v }))}
            saving={isSaving}
            onSave={(v) => saveIdentificationField('irsDelivery', v)}
          />
          <InlineEditSelect
            label="Validar e-Fatura"
            value={
              fp.identification?.validateEInvoice === true
                ? 'Sim'
                : fp.identification?.validateEInvoice === false
                  ? 'Não'
                  : ''
            }
            options={YES_NO_OPTIONS.map((v) => ({ value: v, label: v }))}
            saving={isSaving}
            onSave={(v) => saveIdentificationField('validateEInvoice', v)}
          />
          <InlineEditSelect
            label="Comunicar Agregado Familiar"
            value={
              fp.identification?.communicateHousehold === true
                ? 'Sim'
                : fp.identification?.communicateHousehold === false
                  ? 'Não'
                  : ''
            }
            options={YES_NO_OPTIONS.map((v) => ({ value: v, label: v }))}
            saving={isSaving}
            onSave={(v) => saveIdentificationField('communicateHousehold', v)}
          />
        </ProfileSectionCard>

        <ProfileSectionCard title="Contacto da empresa" description="Canais principais">
          <InlineEditField
            label="E-mail"
            value={client.email || ''}
            saving={isSaving}
            onSave={(v) => debouncedScalar({ email: v })}
          />
          <InlineEditField
            label="Telefone"
            value={client.phone || ''}
            phone
            saving={isSaving}
            onSave={(v) => debouncedScalar({ phone: v })}
          />
        </ProfileSectionCard>

        <ProfileSectionCard title="Contacto principal" description="Pessoa de referência">
          <InlineEditField
            label="Nome"
            value={contact.name || ''}
            saving={isSaving}
            onSave={(v) => saveContact({ name: v })}
          />
          <InlineEditField
            label="Função"
            value={contact.role || ''}
            saving={isSaving}
            onSave={(v) => saveContact({ role: v })}
          />
          <InlineEditField
            label="E-mail"
            value={contact.email || ''}
            saving={isSaving}
            onSave={(v) => saveContact({ email: v })}
          />
          <InlineEditField
            label="Telefone"
            value={contact.phone || ''}
            phone
            saving={isSaving}
            onSave={(v) => saveContact({ phone: v })}
          />
        </ProfileSectionCard>

        <ProfileSectionCard title="Responsável no escritório" description="Passo 3 do registo">
          <InlineEditSelect
            label="Membro da equipa"
            value={(client as { assignedStaffId?: string }).assignedStaffId || ''}
            options={staffOptions}
            saving={isSaving}
            onSave={onStaffChange}
          />
          <InlineEditField
            label="Etiqueta (legado)"
            value={fp.assignedStaffLabel || ''}
            saving={isSaving}
            onSave={(v) => saveMetaField('assignedStaffLabel', v)}
          />
        </ProfileSectionCard>

        <ProfileSectionCard title="Serviços contratados" description="Passo 4 do registo" className="xl:col-span-2">
          <ClientHubServicesSection
            selected={fp.services || []}
            saving={isSaving}
            onChange={(ids) => debouncedMeta({ services: ids })}
          />
        </ProfileSectionCard>

        <ProfileSectionCard title="Notas internas" description="Só visível ao escritório" className="xl:col-span-2">
          <InlineEditField
            label="Observações"
            value={fp.notes || ''}
            saving={isSaving}
            multiline
            onSave={(v) => saveMetaField('notes', v)}
          />
        </ProfileSectionCard>
      </div>
    </div>
  )
}
