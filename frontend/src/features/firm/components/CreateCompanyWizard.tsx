import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  buildClientCreateMetadata,
  emptyClientCreateForm,
  type ClientCreateFormState,
} from '@/features/firm/components/clientCreateForm'
import {
  ACCOUNTING_TYPES,
  IRS_FRAMEWORKS,
  VAT_EXEMPTION_REASONS,
  VAT_REGIMES,
  YES_NO_OPTIONS,
} from '@/features/firm/components/companyCreateConstants'
import { CaeCombobox } from '@/features/firm/components/CaeCombobox'
import {
  getClientRegistrationRules,
  getClientTypeLabelKey,
  getClientTypeOptions,
  getLegalFormOptions,
  normalizeClientType,
} from '@/features/firm/components/clientRegistrationConfig'
import {
  CreateCompanyAddressFields,
  WizardField,
  WizardInput,
  WizardSelect,
} from '@/features/firm/components/CreateCompanyAddressFields'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent } from '@/shared/components/ui/dialog'
import { PhoneNumberInputLazyWrapper as PhoneNumberInput } from '@/shared/components/ui/phone-input-lazy'
import { contabilFirmApi, contabilClientsApi, contabilAccountingServicesApi } from '@/infrastructure/api'
import { digitsOnly, formatNifInput, isValidNIF, isValidPostalCode } from '@/shared/utils/documents'
import { getErrorMessage } from '@/shared/utils/errors'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { cn } from '@/shared/lib/utils'
import { useCountryConfig } from '@/shared/hooks/useCountryConfig'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

type NifStatus = 'idle' | 'checking' | 'valid' | 'invalid'
type WizardStepKey = 'identification' | 'fiscal' | 'singularFiscal' | 'owners' | 'services'

export function CreateCompanyWizard({ open, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation('common')
  const countryConfig = useCountryConfig()
  const [step, setStep] = useState<WizardStepKey>('identification')
  const [form, setForm] = useState<ClientCreateFormState>(emptyClientCreateForm)
  const [saving, setSaving] = useState(false)
  const [nifStatus, setNifStatus] = useState<NifStatus>('idle')
  const [nifMessage, setNifMessage] = useState('')
  const registrationRules = getClientRegistrationRules(countryConfig.code, form.clientType)
  const isIndividualClient = normalizeClientType(form.clientType) === 'INDIVIDUAL'
  const normalizedClientType = normalizeClientType(form.clientType)
  const hasSingularFiscalStep =
    normalizedClientType === 'SELF_EMPLOYED' || normalizedClientType === 'INDIVIDUAL'
  const isIsentoVat = form.vatRegime === 'Isento'
  const clientTypeOptions = getClientTypeOptions(t)
  const legalFormOptions = getLegalFormOptions(countryConfig.code)
  const clientTypeLabel = t(getClientTypeLabelKey(registrationRules.clientType))
  const legalNameFieldLabel = isIndividualClient
    ? t('clientWizard.fields.individualName')
    : t('clientWizard.fields.legalName')

  const { data: staffData } = useQuery({
    queryKey: ['firm-staff'],
    queryFn: () => contabilFirmApi.listStaff(),
    enabled: open,
    staleTime: 120_000,
  })

  const { data: servicesData } = useQuery({
    queryKey: ['accounting-services', 'active'],
    queryFn: () => contabilAccountingServicesApi.list({ activeOnly: true }),
    enabled: open && step === 'services',
    staleTime: 120_000,
  })

  const wizardSteps: Array<{ key: WizardStepKey; label: string }> = [
    { key: 'identification', label: t('clientWizard.steps.identification') },
    { key: 'fiscal', label: t('clientWizard.steps.fiscal') },
    ...(hasSingularFiscalStep
      ? [{ key: 'singularFiscal' as const, label: t('clientWizard.steps.singularFiscal') }]
      : []),
    { key: 'owners', label: t('clientWizard.steps.owners') },
    { key: 'services', label: t('clientWizard.steps.services') },
  ]
  const currentStepIndex = Math.max(
    0,
    wizardSteps.findIndex((wizardStep) => wizardStep.key === step),
  )
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === wizardSteps.length - 1

  const staff = (staffData as { items?: { id: string; fullName?: string; email?: string }[] })?.items || []
  const services =
    (servicesData as { items?: { id: string; name: string; key?: string }[] })?.items?.filter(
      (s) => s.name,
    ) || []

  const set = <K extends keyof ClientCreateFormState>(key: K, value: ClientCreateFormState[K]) => {
    setForm((prev) => {
      if (key === 'clientType') {
        const nextType = normalizeClientType(value as ClientCreateFormState['clientType'])
        if (nextType === 'INDIVIDUAL') {
          return {
            ...prev,
            clientType: nextType,
            vatRegime: '',
            vatExemptionReason: '',
          }
        }
        return {
          ...prev,
          clientType: nextType,
          vatRegime: prev.vatRegime || 'Normal Trimestral',
        }
      }
      return { ...prev, [key]: value }
    })
    if (key === 'taxId') {
      setNifStatus('idle')
      setNifMessage('')
    }
  }

  const setTaxId = (value: string, preserveValidationState = false) => {
    setForm((prev) => ({ ...prev, taxId: value }))
    if (!preserveValidationState) {
      setNifStatus('idle')
      setNifMessage('')
    }
  }

  const reset = () => {
    setForm(emptyClientCreateForm())
    setStep('identification')
    setNifStatus('idle')
    setNifMessage('')
  }

  useEffect(() => {
    if (!open) reset()
  }, [open])

  useEffect(() => {
    if (!wizardSteps.some((wizardStep) => wizardStep.key === step)) {
      setStep('identification')
    }
  }, [step, wizardSteps])

  const validateTaxId = async () => {
    const d = digitsOnly(form.taxId)
    if (countryConfig.code === 'PT') {
      if (d.length !== 9) {
        setNifStatus('invalid')
        setNifMessage(t('clientWizard.validation.taxIdLength'))
        return false
      }
      if (!isValidNIF(d)) {
        setNifStatus('invalid')
        setNifMessage(t('clientWizard.validation.taxIdChecksum'))
        return false
      }
    } else if (d.length < 5) {
      setNifStatus('invalid')
      setNifMessage(t('clientWizard.validation.taxIdLengthGeneric'))
      return false
    }

    if (countryConfig.code !== 'PT') {
      setNifStatus('valid')
      setNifMessage(t('clientWizard.validation.taxIdValid'))
      return true
    }

    setNifStatus('checking')
    try {
      const res = await contabilClientsApi.validateNif(d)
      if (res.valid) {
        setNifStatus('valid')
        setNifMessage(res.message || t('clientWizard.validation.taxIdValid'))
        if (res.normalized) setTaxId(formatNifInput(res.normalized), true)
        return true
      }
      setNifStatus('invalid')
      setNifMessage(res.message || t('clientWizard.validation.taxIdInvalid'))
      return false
    } catch (err) {
      setNifStatus('invalid')
      setNifMessage(getErrorMessage(err))
      return false
    }
  }

  const validateStep = async (currentStep: WizardStepKey): Promise<boolean> => {
    if (currentStep === 'identification') {
      if (!(await validateTaxId())) {
        toast.error(t('clientWizard.validation.validateTaxIdBeforeProceed'))
        return false
      }
      if (!form.clientType) {
        toast.error(t('clientWizard.validation.clientTypeRequired'))
        return false
      }
      if (!form.legalName.trim()) {
        toast.error(
          isIndividualClient
            ? t('clientWizard.validation.individualNameRequired')
            : t('clientWizard.validation.legalNameRequired'),
        )
        return false
      }
      if (!form.address.street.trim()) {
        toast.error(t('clientWizard.validation.addressRequired'))
        return false
      }
      if (!form.address.postalCode.trim() || !isValidPostalCode(countryConfig.code, form.address.postalCode)) {
        toast.error(t('clientWizard.validation.invalidPostalCode'))
        return false
      }
      const locality = form.address.municipality || form.address.parish
      if (!locality?.trim()) {
        toast.error(t('clientWizard.validation.localityRequired'))
        return false
      }
      return true
    }
    if (currentStep === 'fiscal') {
      if (registrationRules.isRequired('accountingType') && !form.accountingType.trim()) {
        toast.error(t('clientWizard.validation.accountingTypeRequired'))
        return false
      }
      if (registrationRules.isRequired('caePrimary') && !form.caePrimary.trim()) {
        toast.error(t('clientWizard.validation.caePrimaryRequired'))
        return false
      }
      if (registrationRules.isRequired('activityStartDate') && !form.activityStartDate.trim()) {
        toast.error(t('clientWizard.validation.activityStartDateRequired'))
        return false
      }
      if (!isIndividualClient && (!form.vatRegime.trim() || !form.irsFramework.trim())) {
        toast.error(t('clientWizard.validation.fiscalFrameworkRequired'))
        return false
      }
      if (isIndividualClient && !form.irsFramework.trim()) {
        toast.error(t('clientWizard.validation.fiscalFrameworkRequired'))
        return false
      }
      if (!isIndividualClient && isIsentoVat && !form.vatExemptionReason.trim()) {
        toast.error(t('clientWizard.validation.vatExemptionReasonRequired'))
        return false
      }
      return true
    }
    if (currentStep === 'owners') {
      if (!form.assignedStaffId && !form.assignedStaffLabel.trim()) {
        toast.error(t('clientWizard.validation.assignedStaffRequired'))
        return false
      }
      return true
    }
    return true
  }

  const goNext = async () => {
    if (!(await validateStep(step))) return
    const nextStep = wizardSteps[currentStepIndex + 1]
    if (nextStep) setStep(nextStep.key)
  }

  const goBack = () => {
    const previousStep = wizardSteps[currentStepIndex - 1]
    if (previousStep) setStep(previousStep.key)
  }

  const toggleService = (id: string) => {
    setForm((prev) => {
      const has = prev.selectedServices.includes(id)
      return {
        ...prev,
        selectedServices: has
          ? prev.selectedServices.filter((x) => x !== id)
          : [...prev.selectedServices, id],
      }
    })
  }

  const handleSubmit = async () => {
    if (!(await validateStep('identification'))) {
      setStep('identification')
      return
    }
    const displayName = form.displayName.trim() || form.legalName.trim()
    setSaving(true)
    try {
      const staffMember = staff.find((u) => u.id === form.assignedStaffId)
      const metadata = buildClientCreateMetadata({
        ...form,
        assignedStaffLabel: staffMember?.fullName || staffMember?.email || form.assignedStaffLabel,
        selectedServices: form.selectedServices,
      })
      await contabilClientsApi.create({
        name: displayName,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        taxId: digitsOnly(form.taxId),
        metadata,
        assignedStaffId: form.assignedStaffId || undefined,
      })
      toast.success(t('clientWizard.toasts.createdSuccess'))
      reset()
      onOpenChange(false)
      onCreated?.()
      emitAppDataChanged({ scope: 'clients' })
    } catch (err) {
      toast.error(t('clientWizard.toasts.createError'), { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="contabil-create-client"
        className="cb-company-dialog flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-xl border border-border/80 p-0"
      >
        <div className="cb-company-dialog-hd">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('clientWizard.title')}</h2>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/60"
            onClick={() => onOpenChange(false)}
            aria-label={t('clientWizard.actions.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="cb-company-steps" aria-label={t('clientWizard.steps.navLabel')}>
          {wizardSteps.map((wizardStep, index) => (
            <div
              key={wizardStep.key}
              className={cn(
                'cb-company-step',
                step === wizardStep.key && 'cb-company-step-active',
                currentStepIndex > index && 'cb-company-step-done',
              )}
            >
              <span className="cb-company-step-num">{index + 1}</span>
              <span className="cb-company-step-label">{wizardStep.label}</span>
            </div>
          ))}
        </nav>

        <div className="cb-company-dialog-body">
          {step === 'identification' ? (
            <section>
              <h3 className="cb-company-section-title">{t('clientWizard.sections.identification.title')}</h3>
              <div className="space-y-4">
                <WizardField
                  id="clientType"
                  label={t('clientWizard.fields.clientType')}
                  required
                  hint={t('clientWizard.hints.clientType')}
                >
                  <WizardSelect
                    id="clientType"
                    value={form.clientType}
                    onChange={(e) => set('clientType', e.target.value as ClientCreateFormState['clientType'])}
                  >
                    {clientTypeOptions.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </WizardSelect>
                </WizardField>

                <WizardField id="taxId" label={countryConfig.taxIdLabel} required>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <WizardInput
                        id="taxId"
                        value={form.taxId}
                        onChange={(e) => setTaxId(formatNifInput(e.target.value))}
                        placeholder="000 000 000"
                        className={cn(
                          nifStatus === 'valid' && 'border-emerald-500 pr-9',
                          nifStatus === 'invalid' && 'border-red-400',
                        )}
                        inputMode="numeric"
                      />
                      {nifStatus === 'valid' ? (
                        <CheckCircle2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 shrink-0 rounded-md px-3 text-xs"
                      disabled={nifStatus === 'checking'}
                      onClick={() => void validateTaxId()}
                    >
                      {nifStatus === 'checking' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('clientWizard.actions.validateTaxId')}
                    </Button>
                  </div>
                  {nifMessage ? (
                    <p
                      className={cn(
                        'cb-company-hint mt-1',
                        nifStatus === 'valid' && 'text-emerald-700',
                        nifStatus === 'invalid' && 'text-red-600',
                      )}
                    >
                      {nifMessage}
                    </p>
                  ) : null}
                </WizardField>

                <WizardField id="legalName" label={legalNameFieldLabel} required>
                  <WizardInput
                    id="legalName"
                    value={form.legalName}
                    onChange={(e) => set('legalName', e.target.value)}
                    placeholder={
                      isIndividualClient
                        ? t('clientWizard.placeholders.individualName')
                        : t('clientWizard.placeholders.legalName')
                    }
                  />
                </WizardField>

                <div className="grid gap-4 sm:grid-cols-2">
                  {registrationRules.isVisible('displayName') ? (
                    <WizardField
                      id="displayName"
                      label={t('clientWizard.fields.displayName')}
                      hint={t('clientWizard.hints.displayName')}
                    >
                      <WizardInput
                        id="displayName"
                        value={form.displayName}
                        onChange={(e) => set('displayName', e.target.value)}
                        placeholder={t('clientWizard.placeholders.displayName')}
                      />
                    </WizardField>
                  ) : null}

                  {registrationRules.isVisible('legalForm') ? (
                    <WizardField
                      id="legalForm"
                      label={t('clientWizard.fields.legalForm')}
                      hint={t('clientWizard.hints.legalForm')}
                    >
                      <WizardSelect
                        id="legalForm"
                        value={form.legalForm}
                        onChange={(e) => set('legalForm', e.target.value)}
                      >
                        <option value="">{t('clientWizard.options.select')}</option>
                        {legalFormOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </WizardSelect>
                    </WizardField>
                  ) : null}
                </div>

                <CreateCompanyAddressFields
                  value={form.address}
                  onChange={(address) => set('address', address)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <WizardField id="phone" label={t('clientWizard.fields.phone')} hint={t('clientWizard.hints.phone')}>
                    <PhoneNumberInput
                      id="phone"
                      defaultCountry={countryConfig.code}
                      value={form.phone || undefined}
                      onChange={(v) => set('phone', v || '')}
                    />
                  </WizardField>
                  <WizardField id="email" label={t('clientWizard.fields.email')} hint={t('clientWizard.hints.email')}>
                    <WizardInput
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder={t('clientWizard.placeholders.email')}
                    />
                  </WizardField>
                </div>
              </div>
            </section>
          ) : null}

          {step === 'fiscal' ? (
            <section>
              <h3 className="cb-company-section-title">{t('clientWizard.sections.fiscal.title')}</h3>
              <p className="cb-company-section-sub">{t('clientWizard.sections.fiscal.subtitle')}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {registrationRules.isVisible('accountingType') ? (
                  <WizardField id="accountingType" label={t('clientWizard.fields.accountingType')} required={registrationRules.isRequired('accountingType')}>
                    <WizardSelect
                      id="accountingType"
                      value={form.accountingType}
                      onChange={(e) => set('accountingType', e.target.value)}
                    >
                      {ACCOUNTING_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </WizardSelect>
                  </WizardField>
                ) : null}

                {registrationRules.isVisible('activityStartDate') ? (
                  <WizardField
                    id="activityStartDate"
                    label={t('clientWizard.fields.activityStartDate')}
                    required={registrationRules.isRequired('activityStartDate')}
                    hint={t('clientWizard.hints.activityStartDate')}
                  >
                    <WizardInput
                      id="activityStartDate"
                      type="date"
                      value={form.activityStartDate}
                      onChange={(e) => set('activityStartDate', e.target.value)}
                    />
                  </WizardField>
                ) : null}

                {registrationRules.isVisible('shareCapital') ? (
                  <WizardField id="shareCapital" label={t('clientWizard.fields.shareCapital')} hint={t('clientWizard.hints.optional')}>
                    <div className="relative">
                      <WizardInput
                        id="shareCapital"
                        value={form.shareCapital}
                        onChange={(e) => set('shareCapital', e.target.value)}
                        placeholder="5.000,00"
                        className="pr-8"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                    </div>
                  </WizardField>
                ) : null}
              </div>

              {registrationRules.isVisible('caePrimary') ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <WizardField id="caePrimary" label={t('clientWizard.fields.caePrimary')} required={registrationRules.isRequired('caePrimary')} hint={t('clientWizard.hints.caePrimary')}>
                    <CaeCombobox
                      id="caePrimary"
                      value={form.caePrimary}
                      onChange={(v) => set('caePrimary', v)}
                      placeholder={t('clientWizard.placeholders.caePrimary')}
                    />
                  </WizardField>
                  {registrationRules.isVisible('caeSecondary') ? (
                    <>
                      <WizardField id="caeSecondary1" label={t('clientWizard.fields.caeSecondary')}>
                        <CaeCombobox
                          id="caeSecondary1"
                          value={form.caeSecondary1}
                          onChange={(v) => set('caeSecondary1', v)}
                        />
                      </WizardField>
                      <WizardField id="caeSecondary2" label={t('clientWizard.fields.caeSecondary2')}>
                        <CaeCombobox
                          id="caeSecondary2"
                          value={form.caeSecondary2}
                          onChange={(v) => set('caeSecondary2', v)}
                        />
                      </WizardField>
                    </>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {!isIndividualClient ? (
                  <>
                    <WizardField id="vatRegime" label={t('clientWizard.fields.vatRegime')} required>
                      <WizardSelect
                        id="vatRegime"
                        value={form.vatRegime}
                        onChange={(e) => set('vatRegime', e.target.value)}
                      >
                        {VAT_REGIMES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </WizardSelect>
                    </WizardField>

                    {isIsentoVat ? (
                      <WizardField id="vatExemptionReason" label={t('clientWizard.fields.vatExemptionReason')} required>
                        <WizardSelect
                          id="vatExemptionReason"
                          value={form.vatExemptionReason}
                          onChange={(e) => set('vatExemptionReason', e.target.value)}
                        >
                          <option value="">{t('clientWizard.options.select')}</option>
                          {VAT_EXEMPTION_REASONS.map((reason) => (
                            <option key={reason} value={reason}>
                              {reason}
                            </option>
                          ))}
                        </WizardSelect>
                      </WizardField>
                    ) : null}
                  </>
                ) : null}

                <WizardField id="irsFramework" label={t('clientWizard.fields.irsFramework')} required>
                  <WizardSelect
                    id="irsFramework"
                    value={form.irsFramework}
                    onChange={(e) => set('irsFramework', e.target.value)}
                  >
                    {IRS_FRAMEWORKS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </WizardSelect>
                </WizardField>
              </div>

              <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 p-4">
                <h4 className="text-sm font-semibold text-foreground">{t('clientWizard.sections.socialSecurity')}</h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <WizardField id="socialSecurityArea" label={t('clientWizard.fields.socialSecurityArea')}>
                    <WizardInput
                      id="socialSecurityArea"
                      value={form.socialSecurityArea}
                      onChange={(e) => set('socialSecurityArea', e.target.value)}
                      placeholder={t('clientWizard.placeholders.socialSecurityArea')}
                    />
                  </WizardField>
                  <WizardField id="socialSecurityOneYearExemption" label={t('clientWizard.fields.socialSecurityOneYearExemption')}>
                    <WizardSelect
                      id="socialSecurityOneYearExemption"
                      value={form.socialSecurityOneYearExemption}
                      onChange={(e) => set('socialSecurityOneYearExemption', e.target.value)}
                    >
                      <option value="">{t('clientWizard.options.select')}</option>
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </WizardSelect>
                  </WizardField>
                  <WizardField id="socialSecurityStartDate" label={t('clientWizard.fields.socialSecurityStartDate')}>
                    <WizardInput
                      id="socialSecurityStartDate"
                      type="date"
                      value={form.socialSecurityStartDate}
                      onChange={(e) => set('socialSecurityStartDate', e.target.value)}
                    />
                  </WizardField>
                  <WizardField id="socialSecurityQuarterlyDeclaration" label={t('clientWizard.fields.socialSecurityQuarterlyDeclaration')}>
                    <WizardSelect
                      id="socialSecurityQuarterlyDeclaration"
                      value={form.socialSecurityQuarterlyDeclaration}
                      onChange={(e) => set('socialSecurityQuarterlyDeclaration', e.target.value)}
                    >
                      <option value="">{t('clientWizard.options.select')}</option>
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </WizardSelect>
                  </WizardField>
                </div>
              </div>
            </section>
          ) : null}

          {step === 'singularFiscal' ? (
            <section>
              <h3 className="cb-company-section-title">{t('clientWizard.sections.singularFiscal.title')}</h3>
              <p className="cb-company-section-sub">{t('clientWizard.sections.singularFiscal.subtitle')}</p>

              <div className="mt-4 rounded-lg border border-border/60 bg-muted/10 p-4">
                <h4 className="text-sm font-semibold text-foreground">{t('clientWizard.sections.identificationCard')}</h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <WizardField id="spouse" label={t('clientWizard.fields.spouse')}>
                    <WizardSelect id="spouse" value={form.spouse} onChange={(e) => set('spouse', e.target.value)}>
                      <option value="">{t('clientWizard.options.select')}</option>
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </WizardSelect>
                  </WizardField>
                  <WizardField id="irsDelivery" label={t('clientWizard.fields.irsDelivery')}>
                    <WizardSelect id="irsDelivery" value={form.irsDelivery} onChange={(e) => set('irsDelivery', e.target.value)}>
                      <option value="">{t('clientWizard.options.select')}</option>
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </WizardSelect>
                  </WizardField>
                  <WizardField id="validateEInvoice" label={t('clientWizard.fields.validateEInvoice')}>
                    <WizardSelect
                      id="validateEInvoice"
                      value={form.validateEInvoice}
                      onChange={(e) => set('validateEInvoice', e.target.value)}
                    >
                      <option value="">{t('clientWizard.options.select')}</option>
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </WizardSelect>
                  </WizardField>
                  <WizardField id="communicateHousehold" label={t('clientWizard.fields.communicateHousehold')}>
                    <WizardSelect
                      id="communicateHousehold"
                      value={form.communicateHousehold}
                      onChange={(e) => set('communicateHousehold', e.target.value)}
                    >
                      <option value="">{t('clientWizard.options.select')}</option>
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </WizardSelect>
                  </WizardField>
                </div>
              </div>
            </section>
          ) : null}

          {step === 'owners' ? (
            <section>
              <h3 className="cb-company-section-title">{t('clientWizard.sections.owners.title')}</h3>
              <p className="cb-company-section-sub">{t('clientWizard.sections.owners.subtitle')}</p>
              <div className="mt-4 space-y-4">
                <WizardField id="assignedStaff" label={t('clientWizard.fields.assignedStaff')} required>
                  <WizardSelect
                    id="assignedStaff"
                    value={form.assignedStaffId}
                    onChange={(e) => {
                      const id = e.target.value
                      set('assignedStaffId', id)
                      const u = staff.find((x) => x.id === id)
                      if (u) set('assignedStaffLabel', u.fullName || u.email || '')
                    }}
                  >
                    <option value="">{t('clientWizard.options.select')}</option>
                    {staff.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email}
                      </option>
                    ))}
                  </WizardSelect>
                  {!staff.length ? (
                    <WizardInput
                      className="mt-2"
                      placeholder={t('clientWizard.placeholders.assignedStaff')}
                      value={form.assignedStaffLabel}
                      onChange={(e) => set('assignedStaffLabel', e.target.value)}
                    />
                  ) : null}
                </WizardField>

                <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                  <p className="mb-3 text-xs font-semibold text-foreground">{t('clientWizard.sections.primaryContact')}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <WizardField id="contactName" label={t('clientWizard.fields.name')}>
                      <WizardInput
                        id="contactName"
                        value={form.contactName}
                        onChange={(e) => set('contactName', e.target.value)}
                      />
                    </WizardField>
                    <WizardField id="contactRole" label={t('clientWizard.fields.role')}>
                      <WizardInput
                        id="contactRole"
                        value={form.contactRole}
                        onChange={(e) => set('contactRole', e.target.value)}
                        placeholder={t('clientWizard.placeholders.role')}
                      />
                    </WizardField>
                    <WizardField id="contactEmail" label={t('clientWizard.fields.email')}>
                      <WizardInput
                        id="contactEmail"
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => set('contactEmail', e.target.value)}
                      />
                    </WizardField>
                    <WizardField id="contactPhone" label={t('clientWizard.fields.phone')}>
                      <PhoneNumberInput
                        defaultCountry={countryConfig.code}
                        value={form.contactPhone || undefined}
                        onChange={(v) => set('contactPhone', v || '')}
                      />
                    </WizardField>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {step === 'services' ? (
            <section>
              <h3 className="cb-company-section-title">{t('clientWizard.sections.services.title')}</h3>
              <p className="cb-company-section-sub">{t('clientWizard.sections.services.subtitle')}</p>
              <div className="mt-4 space-y-2">
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t('clientWizard.services.emptyState')}
                  </p>
                ) : (
                  services.map((svc) => (
                    <label
                      key={svc.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 text-sm hover:bg-muted/20"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={form.selectedServices.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                      />
                      <span>{svc.name}</span>
                    </label>
                  ))
                )}
              </div>
              <div className="mt-4">
                <WizardField id="notes" label={t('clientWizard.fields.notes')}>
                  <textarea
                    id="notes"
                    className="cb-company-input min-h-[80px] resize-y"
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder={t('clientWizard.placeholders.notes')}
                  />
                </WizardField>
              </div>
              <div className="mt-4 rounded-lg border border-border/50 bg-muted/10 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{form.legalName || form.displayName || t('clientWizard.summary.newClient')}</p>
                <p>{countryConfig.taxIdLabel} {form.taxId || '—'} · {clientTypeLabel} · {form.accountingType || '—'}</p>
                {!isIndividualClient && form.vatRegime ? (
                  <p>{form.vatRegime}{isIsentoVat && form.vatExemptionReason ? ` · ${form.vatExemptionReason}` : ''}</p>
                ) : form.irsFramework ? (
                  <p>{form.irsFramework}</p>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="cb-company-dialog-ft">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => onOpenChange(false)}>
            {t('clientWizard.actions.cancel')}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-md"
              disabled={isFirstStep}
              onClick={goBack}
            >
              {t('clientWizard.actions.back')}
            </Button>
            {!isLastStep ? (
              <Button type="button" className="h-9 rounded-md px-4" onClick={() => void goNext()}>
                {t('clientWizard.actions.continue')}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="button" className="h-9 rounded-md px-4" disabled={saving} onClick={() => void handleSubmit()}>
                {saving ? t('clientWizard.actions.creating') : t('clientWizard.actions.create')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
