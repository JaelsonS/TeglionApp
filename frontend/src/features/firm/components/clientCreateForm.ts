import type { ClientAddressFormState } from '@/features/firm/components/clientAddress'
import { buildAddressMetadata, emptyClientAddressForm } from '@/features/firm/components/clientAddress'
import { normalizeClientType, type StableClientType } from '@/features/firm/components/clientRegistrationConfig'
import type { ClientFiscalProfile } from '@/infrastructure/api/contabil/types'

export type ClientCreateFormState = {
  clientType: StableClientType
  displayName: string
  legalForm: string
  legalName: string
  accountingType: string
  address: ClientAddressFormState
  taxId: string
  caePrimary: string
  caeSecondary1: string
  caeSecondary2: string
  vatRegime: string
  vatExemptionReason: string
  irsFramework: string
  shareCapital: string
  activityStartDate: string
  email: string
  phone: string
  assignedStaffId: string
  assignedStaffLabel: string
  contactName: string
  contactRole: string
  contactEmail: string
  contactPhone: string
  selectedServices: string[]
  notes: string
  socialSecurityArea: string
  socialSecurityOneYearExemption: string
  socialSecurityStartDate: string
  socialSecurityQuarterlyDeclaration: string
  spouse: string
  irsDelivery: string
  validateEInvoice: string
  communicateHousehold: string
}

export const emptyClientCreateForm = (): ClientCreateFormState => ({
  clientType: 'COMPANY',
  displayName: '',
  legalForm: '',
  legalName: '',
  accountingType: 'Contabilidade Organizada',
  address: emptyClientAddressForm(),
  taxId: '',
  caePrimary: '',
  caeSecondary1: '',
  caeSecondary2: '',
  vatRegime: 'Normal Trimestral',
  vatExemptionReason: '',
  irsFramework: 'IRC — Regime geral',
  shareCapital: '',
  activityStartDate: '',
  email: '',
  phone: '',
  assignedStaffId: '',
  assignedStaffLabel: '',
  contactName: '',
  contactRole: '',
  contactEmail: '',
  contactPhone: '',
  selectedServices: [],
  notes: '',
  socialSecurityArea: '',
  socialSecurityOneYearExemption: '',
  socialSecurityStartDate: '',
  socialSecurityQuarterlyDeclaration: '',
  spouse: '',
  irsDelivery: '',
  validateEInvoice: '',
  communicateHousehold: '',
})

export function buildClientCreateMetadata(
  form: ClientCreateFormState,
): Partial<ClientFiscalProfile> | undefined {
  const caeSecondary = [form.caeSecondary1, form.caeSecondary2].map((s) => s.trim()).filter(Boolean)
  const meta: Partial<ClientFiscalProfile> = {}

  const clientType = normalizeClientType(form.clientType)
  const isIndividual = clientType === 'INDIVIDUAL'
  if (form.clientType) meta.clientType = clientType
  if (form.legalForm.trim()) meta.legalForm = form.legalForm.trim()
  if (form.accountingType.trim()) meta.accountingType = form.accountingType.trim() as ClientFiscalProfile['accountingType']
  if (form.legalName.trim()) meta.legalName = form.legalName.trim()
  if (form.selectedServices.length) meta.services = form.selectedServices
  const addressMeta = buildAddressMetadata(form.address)
  if (addressMeta) meta.address = addressMeta
  if (form.caePrimary.trim()) meta.caePrimary = form.caePrimary.trim()
  if (caeSecondary.length) meta.caeSecondary = caeSecondary

  // Particulares não têm regime de IVA — não persistir defaults/valores de IVA.
  if (!isIndividual) {
    if (form.vatRegime.trim()) meta.vatRegime = form.vatRegime.trim()
    if (form.vatExemptionReason.trim()) meta.vatExemptionReason = form.vatExemptionReason.trim()
  }
  if (form.irsFramework.trim()) meta.irsFramework = form.irsFramework.trim()
  if (form.shareCapital.trim()) meta.shareCapital = form.shareCapital.trim()
  if (form.activityStartDate.trim()) meta.activityStartDate = form.activityStartDate.trim()
  if (form.assignedStaffLabel.trim()) meta.assignedStaffLabel = form.assignedStaffLabel.trim()

  const socialSecurity = {
    area: form.socialSecurityArea.trim() || null,
    oneYearExemption: form.socialSecurityOneYearExemption ? form.socialSecurityOneYearExemption === 'Sim' : null,
    startDate: form.socialSecurityStartDate.trim() || null,
    quarterlyDeclaration: form.socialSecurityQuarterlyDeclaration
      ? form.socialSecurityQuarterlyDeclaration === 'Sim'
      : null,
  }
  if (socialSecurity.area || socialSecurity.oneYearExemption !== null || socialSecurity.startDate || socialSecurity.quarterlyDeclaration !== null) {
    meta.socialSecurity = socialSecurity
  }

  const identification = {
    spouse: form.spouse ? form.spouse === 'Sim' : null,
    irsDelivery: form.irsDelivery ? form.irsDelivery === 'Sim' : null,
    validateEInvoice: form.validateEInvoice ? form.validateEInvoice === 'Sim' : null,
    communicateHousehold: form.communicateHousehold ? form.communicateHousehold === 'Sim' : null,
  }
  if (
    identification.spouse !== null ||
    identification.irsDelivery !== null ||
    identification.validateEInvoice !== null ||
    identification.communicateHousehold !== null
  ) {
    meta.identification = identification
  }

  const contacts = []
  if (form.contactName.trim() || form.contactEmail.trim() || form.contactPhone.trim()) {
    contacts.push({
      name: form.contactName.trim() || null,
      role: form.contactRole.trim() || null,
      email: form.contactEmail.trim() || null,
      phone: form.contactPhone.trim() || null,
    })
  }
  if (contacts.length) meta.contacts = contacts

  if (form.notes.trim()) meta.notes = form.notes.trim()

  return Object.keys(meta).length ? meta : undefined
}
