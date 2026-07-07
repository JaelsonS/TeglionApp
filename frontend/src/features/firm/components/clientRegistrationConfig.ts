import type { TFunction } from 'i18next'

export const STABLE_CLIENT_TYPES = ['COMPANY', 'SELF_EMPLOYED', 'INDIVIDUAL'] as const

export type StableClientType = (typeof STABLE_CLIENT_TYPES)[number]

export type ClientTypeInput = StableClientType | 'Empresa' | 'Independente' | 'Particular' | 'Trabalhador Independente' | null | undefined

export type ClientRegistrationField =
  | 'displayName'
  | 'legalForm'
  | 'accountingType'
  | 'activityStartDate'
  | 'shareCapital'
  | 'caePrimary'
  | 'caeSecondary'

type CountryRuleSet = {
  visible: ClientRegistrationField[]
  required: ClientRegistrationField[]
}

type CountryRegistrationConfig = {
  rulesByType: Record<StableClientType, CountryRuleSet>
}

const LEGACY_TO_STABLE: Record<string, StableClientType> = {
  EMPRESA: 'COMPANY',
  INDEPENDENTE: 'SELF_EMPLOYED',
  PARTICULAR: 'INDIVIDUAL',
  'TRABALHADOR INDEPENDENTE': 'SELF_EMPLOYED',
}

const COUNTRY_RULES: Record<string, CountryRegistrationConfig> = {
  PT: {
    rulesByType: {
      COMPANY: {
        visible: ['displayName', 'legalForm', 'accountingType', 'activityStartDate', 'shareCapital', 'caePrimary', 'caeSecondary'],
        required: ['accountingType', 'activityStartDate', 'caePrimary'],
      },
      SELF_EMPLOYED: {
        visible: ['accountingType', 'activityStartDate', 'shareCapital', 'caePrimary', 'caeSecondary'],
        required: ['accountingType', 'activityStartDate', 'caePrimary'],
      },
      INDIVIDUAL: {
        visible: [],
        required: [],
      },
    },
  },
  BR: {
    rulesByType: {
      COMPANY: {
        visible: ['displayName', 'legalForm', 'accountingType', 'activityStartDate', 'shareCapital', 'caePrimary', 'caeSecondary'],
        required: ['accountingType', 'activityStartDate', 'caePrimary'],
      },
      SELF_EMPLOYED: {
        visible: ['accountingType', 'activityStartDate', 'shareCapital', 'caePrimary', 'caeSecondary'],
        required: ['accountingType', 'activityStartDate', 'caePrimary'],
      },
      INDIVIDUAL: {
        visible: [],
        required: [],
      },
    },
  },
  ES: {
    rulesByType: {
      COMPANY: {
        visible: ['displayName', 'legalForm', 'accountingType', 'activityStartDate', 'shareCapital', 'caePrimary', 'caeSecondary'],
        required: ['accountingType', 'activityStartDate', 'caePrimary'],
      },
      SELF_EMPLOYED: {
        visible: ['accountingType', 'activityStartDate', 'shareCapital', 'caePrimary', 'caeSecondary'],
        required: ['accountingType', 'activityStartDate', 'caePrimary'],
      },
      INDIVIDUAL: {
        visible: [],
        required: [],
      },
    },
  },
}

const DEFAULT_COUNTRY_CONFIG = COUNTRY_RULES.PT

type LegalFormOptionsResolver = (countryCode: string) => string[]

const DEFAULT_LEGAL_FORMS_BY_COUNTRY: Record<string, string[]> = {
  PT: [
    'Sociedade por Quotas',
    'Sociedade Unipessoal por Quotas',
    'Sociedade Anónima',
    'Cooperativa',
    'Associação',
    'Fundação',
    'Outra',
  ],
}

let legalFormOptionsResolver: LegalFormOptionsResolver = (countryCode) => {
  const normalizedCountryCode = normalizeCountryCode(countryCode)
  return (
    DEFAULT_LEGAL_FORMS_BY_COUNTRY[normalizedCountryCode] ||
    DEFAULT_LEGAL_FORMS_BY_COUNTRY.PT ||
    []
  )
}

export function setLegalFormOptionsResolver(resolver: LegalFormOptionsResolver) {
  legalFormOptionsResolver = resolver
}

export function getLegalFormOptions(countryCode?: string | null): string[] {
  return legalFormOptionsResolver(normalizeCountryCode(countryCode))
}

export function normalizeCountryCode(countryCode?: string | null): string {
  const normalized = String(countryCode || 'PT').trim().toUpperCase()
  if (!normalized) return 'PT'
  return normalized
}

export function normalizeClientType(value: ClientTypeInput): StableClientType {
  const raw = String(value || '').trim()
  if (!raw) return 'COMPANY'
  const upper = raw.toUpperCase()
  if (STABLE_CLIENT_TYPES.includes(upper as StableClientType)) {
    return upper as StableClientType
  }
  return LEGACY_TO_STABLE[upper] || 'COMPANY'
}

export function getClientTypeLabelKey(type: StableClientType) {
  if (type === 'COMPANY') return 'clientWizard.clientTypes.company'
  if (type === 'SELF_EMPLOYED') return 'clientWizard.clientTypes.selfEmployed'
  return 'clientWizard.clientTypes.individual'
}

export function getClientTypeOptions(t: TFunction): Array<{ value: StableClientType; label: string }> {
  return STABLE_CLIENT_TYPES.map((type) => ({
    value: type,
    label: t(getClientTypeLabelKey(type)),
  }))
}

export function getClientRegistrationRules(countryCode: string | null | undefined, clientType: ClientTypeInput) {
  const normalizedCountryCode = normalizeCountryCode(countryCode)
  const stableClientType = normalizeClientType(clientType)
  const config = COUNTRY_RULES[normalizedCountryCode] || DEFAULT_COUNTRY_CONFIG
  const ruleSet = config.rulesByType[stableClientType]
  const visible = new Set<ClientRegistrationField>(ruleSet.visible)
  const required = new Set<ClientRegistrationField>(ruleSet.required)

  return {
    countryCode: normalizedCountryCode,
    clientType: stableClientType,
    isVisible(field: ClientRegistrationField) {
      return visible.has(field)
    },
    isRequired(field: ClientRegistrationField) {
      return required.has(field)
    },
  }
}
