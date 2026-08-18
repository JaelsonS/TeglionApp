import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import {
  isMayaFabVisible,
  MAYA_FAB_STORAGE_KEY,
  setMayaFabVisible,
} from '@/features/maya/mayaFabPreference'
import {
  getMayaIntent,
  MAYA_CATALOG_INTENT_IDS,
  MAYA_CLIENT_CATALOG_INTENT_IDS,
  MAYA_LANDING_CATALOG_INTENT_IDS,
  MAYA_INTENTS,
  MAYA_MODULE_INTENT,
  MAYA_PAGES,
  resolveMayaPage,
} from '@/features/maya/mayaContent'

function installLocalStorageMock() {
  const store = new Map<string, string>()
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v))
    },
    removeItem: (k: string) => {
      store.delete(k)
    },
    clear: () => store.clear(),
  }
  const listeners = new Set<(ev: Event) => void>()
  ;(globalThis as { window?: unknown }).window = {
    localStorage,
    addEventListener: (_: string, fn: (ev: Event) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (ev: Event) => void) => listeners.delete(fn),
    dispatchEvent: (ev: Event) => {
      listeners.forEach((fn) => fn(ev))
      return true
    },
  }
  return { store, localStorage, listeners }
}

describe('mayaFabPreference', () => {
  beforeEach(() => {
    installLocalStorageMock()
  })

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window
  })

  it('defaults to visible when unset', () => {
    expect(isMayaFabVisible()).toBe(true)
  })

  it('persists hide and show', () => {
    setMayaFabVisible(false)
    expect(window.localStorage.getItem(MAYA_FAB_STORAGE_KEY)).toBe('0')
    expect(isMayaFabVisible()).toBe(false)
    setMayaFabVisible(true)
    expect(isMayaFabVisible()).toBe(true)
  })

  it('dispatches change event', () => {
    const spy = vi.fn()
    window.addEventListener('teglion:maya-fab-changed', spy)
    setMayaFabVisible(false)
    expect(spy).toHaveBeenCalled()
    window.removeEventListener('teglion:maya-fab-changed', spy)
  })
})

describe('mayaContent', () => {
  it('resolves core module intents', () => {
    expect(getMayaIntent('public-page')?.deepLink).toContain('pagina-publica')
    expect(getMayaIntent('payments')?.id).toBe('payments')
    expect(getMayaIntent('obligations')?.relatedIntents.length).toBeGreaterThan(0)
  })

  it('maps modules to known intents', () => {
    for (const intentId of Object.values(MAYA_MODULE_INTENT)) {
      expect(getMayaIntent(intentId), intentId).toBeTruthy()
    }
  })

  it('keeps related intents resolvable', () => {
    for (const intent of MAYA_INTENTS) {
      for (const related of intent.relatedIntents) {
        expect(getMayaIntent(related), `${intent.id} → ${related}`).toBeTruthy()
      }
    }
  })

  it('keeps next-step intents resolvable', () => {
    for (const intent of MAYA_INTENTS) {
      for (const step of intent.nextSteps ?? []) {
        if (step.intentId) {
          expect(getMayaIntent(step.intentId), `${intent.id} next → ${step.intentId}`).toBeTruthy()
        }
      }
    }
  })

  it('uses unique intent ids', () => {
    const ids = MAYA_INTENTS.map((intent) => intent.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses unique field ids within each intent', () => {
    for (const intent of MAYA_INTENTS) {
      const ids = (intent.fields ?? []).map((field) => field.id)
      expect(new Set(ids).size, intent.id).toBe(ids.length)
    }
  })

  it('keeps deep links inside the matching app', () => {
    for (const intent of MAYA_INTENTS) {
      if (intent.surface === 'client') {
        expect(intent.deepLink.startsWith('/app/client'), intent.id).toBe(true)
      } else if (intent.surface === 'landing') {
        expect(
          intent.deepLink.startsWith('/app/firm/') ||
            intent.deepLink.startsWith('/app/client') ||
            intent.deepLink.startsWith('http') ||
            intent.deepLink.startsWith('/auth') ||
            intent.deepLink.startsWith('/#'),
          intent.id,
        ).toBe(true)
      } else {
        expect(intent.deepLink.startsWith('/app/firm/'), intent.id).toBe(true)
      }
    }
  })

  it('resolves catalog area intents', () => {
    for (const id of MAYA_CATALOG_INTENT_IDS) {
      expect(getMayaIntent(id), id).toBeTruthy()
    }
  })

  it('resolves client catalog intents', () => {
    for (const id of MAYA_CLIENT_CATALOG_INTENT_IDS) {
      expect(getMayaIntent(id), id).toBeTruthy()
      expect(getMayaIntent(id)?.surface).toBe('client')
    }
  })

  it('resolves landing catalog intents', () => {
    for (const id of MAYA_LANDING_CATALOG_INTENT_IDS) {
      expect(getMayaIntent(id), id).toBeTruthy()
      expect(getMayaIntent(id)?.surface).toBe('landing')
    }
    expect(getMayaIntent('landing-human')?.deepLink).toMatch(/^https:\/\/wa\.me\//)
  })

  it('resolves every page topic', () => {
    for (const page of MAYA_PAGES) {
      expect(getMayaIntent(page.primaryIntentId), page.id).toBeTruthy()
      for (const topicId of page.topicIds) {
        expect(getMayaIntent(topicId), `${page.id} → ${topicId}`).toBeTruthy()
      }
    }
  })
})

describe('resolveMayaPage', () => {
  it('maps IRS to the IRS guide', () => {
    const page = resolveMayaPage('/app/firm/irs', new URLSearchParams())
    expect(page?.id).toBe('irs')
    expect(page?.primaryIntentId).toBe('irs-campaign')
  })

  it('maps settings tabs before the hub', () => {
    expect(
      resolveMayaPage('/app/firm/settings', new URLSearchParams('tab=pagina-publica'))?.id,
    ).toBe('settings-public')
    expect(
      resolveMayaPage('/app/firm/settings', new URLSearchParams('tab=pagamentos'))?.id,
    ).toBe('settings-payments')
    expect(resolveMayaPage('/app/firm/settings', new URLSearchParams())?.id).toBe('settings')
  })

  it('maps services tabs', () => {
    expect(
      resolveMayaPage('/app/firm/services', new URLSearchParams('tab=inquiries'))?.id,
    ).toBe('services-inquiries')
    expect(
      resolveMayaPage('/app/firm/services', new URLSearchParams('tab=central'))?.id,
    ).toBe('services-central')
    expect(resolveMayaPage('/app/firm/services', new URLSearchParams())?.id).toBe('services')
  })

  it('maps client portal screens', () => {
    expect(resolveMayaPage('/app/client', new URLSearchParams())?.id).toBe('portal-home')
    expect(resolveMayaPage('/app/client/services', new URLSearchParams())?.id).toBe('portal-services')
    expect(resolveMayaPage('/app/client/agenda', new URLSearchParams())?.id).toBe('portal-deadlines')
    expect(resolveMayaPage('/app/client/account', new URLSearchParams())?.id).toBe('portal-account')
  })

  it('maps the public landing page', () => {
    expect(resolveMayaPage('/', new URLSearchParams())?.id).toBe('landing-home')
    expect(resolveMayaPage('/blog', new URLSearchParams())?.id).not.toBe('landing-home')
  })

  it('maps client hub as more specific than the list', () => {
    expect(resolveMayaPage('/app/firm/clients', new URLSearchParams())?.id).toBe('clients')
    expect(resolveMayaPage('/app/firm/clients/abc', new URLSearchParams())?.id).toBe('clients-hub')
  })

  it('maps documents and tasks sub-routes', () => {
    expect(resolveMayaPage('/app/firm/documents/requests', new URLSearchParams())?.id).toBe(
      'documents-requests',
    )
    expect(resolveMayaPage('/app/firm/tasks/obligations', new URLSearchParams())?.id).toBe(
      'tasks-obligations',
    )
    expect(resolveMayaPage('/app/firm/agenda', new URLSearchParams('panel=settings'))?.id).toBe(
      'agenda-settings',
    )
  })

  it('covers the IRS reference with fields and next steps', () => {
    const create = getMayaIntent('irs-create-service')
    const modelo = getMayaIntent('irs-modelo3')
    const publish = getMayaIntent('irs-publish')
    expect(create?.fields?.length).toBeGreaterThan(0)
    expect(modelo?.fields?.some((field) => field.id === 'taxYear')).toBe(true)
    expect(publish?.fields?.some((field) => field.id === 'slug')).toBe(true)
    expect(getMayaIntent('service-editor')?.fields?.length).toBeGreaterThan(5)
    expect(getMayaIntent('clients-create')?.fields?.length).toBeGreaterThan(10)
  })

  it('maps client list, create modal and hub tabs', () => {
    expect(resolveMayaPage('/app/firm/clients', new URLSearchParams())?.id).toBe('clients')
    expect(resolveMayaPage('/app/firm/clients', new URLSearchParams('create=1'))?.id).toBe(
      'clients-create',
    )
    expect(resolveMayaPage('/app/firm/clients', new URLSearchParams('create=1'))?.primaryIntentId).toBe(
      'clients-create',
    )
    expect(resolveMayaPage('/app/firm/clients/abc', new URLSearchParams())?.id).toBe('clients-hub')
    expect(resolveMayaPage('/app/firm/clients/abc', new URLSearchParams('section=profile'))?.id).toBe(
      'clients-hub-profile',
    )
    expect(resolveMayaPage('/app/firm/clients/abc', new URLSearchParams('section=accesses'))?.id).toBe(
      'clients-hub-accesses',
    )
    expect(
      resolveMayaPage('/app/firm/clients/abc', new URLSearchParams('section=documents'))?.id,
    ).toBe('clients-hub-documents')
    expect(
      resolveMayaPage('/app/firm/clients/abc', new URLSearchParams('section=timeline'))?.id,
    ).toBe('clients-hub-timeline')
    expect(
      resolveMayaPage('/app/firm/clients/abc', new URLSearchParams('section=obligations'))?.id,
    ).toBe('clients-hub-obligations')
    expect(resolveMayaPage('/app/firm/clients/abc', new URLSearchParams('section=tasks'))?.id).toBe(
      'clients-hub-tasks',
    )
    expect(
      resolveMayaPage('/app/firm/clients/abc', new URLSearchParams('section=messages'))?.id,
    ).toBe('clients-hub-messages')
  })
})

describe('Maya Clientes coverage', () => {
  const CREATE_FIELD_IDS = [
    'clientType',
    'taxId',
    'legalName',
    'displayName',
    'legalForm',
    'phone',
    'email',
    'postalCode',
    'locality',
    'parish',
    'street',
    'accountingType',
    'activityStartDate',
    'shareCapital',
    'caePrimary',
    'caeSecondary',
    'caeSecondary2',
    'vatRegime',
    'vatExemptionReason',
    'irsFramework',
    'socialSecurityArea',
    'socialSecurityOneYearExemption',
    'socialSecurityStartDate',
    'socialSecurityQuarterlyDeclaration',
    'spouse',
    'irsDelivery',
    'validateEInvoice',
    'communicateHousehold',
    'assignedStaff',
    'contactName',
    'contactRole',
    'contactEmail',
    'contactPhone',
    'services',
    'notes',
  ]

  const CLIENT_INTENT_IDS = [
    'clients',
    'clients-list',
    'clients-search',
    'clients-filters',
    'clients-create',
    'clients-create-identification',
    'clients-create-fiscal',
    'clients-create-singular',
    'clients-create-owners',
    'clients-create-services',
    'clients-create-save',
    'clients-next-steps',
    'clients-invite',
    'clients-archive',
    'clients-problems',
    'client-hub',
    'client-hub-overview',
    'client-profile',
    'client-official-accesses',
    'client-documents',
    'client-services',
    'client-requests',
    'client-notes',
    'client-history',
    'client-obligations',
    'client-tasks',
    'client-messages',
    'client-actions',
  ]

  it('registers every Clientes intent', () => {
    for (const id of CLIENT_INTENT_IDS) {
      expect(getMayaIntent(id), id).toBeTruthy()
    }
  })

  it('explains every create-wizard field', () => {
    const ids = new Set((getMayaIntent('clients-create')?.fields ?? []).map((field) => field.id))
    expect(ids.size).toBe(CREATE_FIELD_IDS.length)
    for (const id of CREATE_FIELD_IDS) {
      expect(ids.has(id), id).toBe(true)
    }
  })

  it('explains profile fields including hub-only address and legacy staff label', () => {
    const ids = new Set((getMayaIntent('client-profile')?.fields ?? []).map((field) => field.id))
    expect(ids.has('district')).toBe(true)
    expect(ids.has('municipality')).toBe(true)
    expect(ids.has('assignedStaffLabel')).toBe(true)
    expect(ids.has('taxId')).toBe(true)
    expect(ids.has('notes')).toBe(true)
    expect(ids.has('legalForm')).toBe(false)
  })

  it('keeps Clientes deep links inside the firm app', () => {
    for (const id of CLIENT_INTENT_IDS) {
      const intent = getMayaIntent(id)
      expect(intent?.deepLink.startsWith('/app/firm/'), id).toBe(true)
    }
  })

  it('points create and save CTAs to the list with the create query', () => {
    expect(getMayaIntent('clients-create')?.deepLink).toBe('/app/firm/clients?create=1')
    expect(getMayaIntent('clients-create-save')?.nextSteps?.some((step) => step.intentId === 'clients-next-steps')).toBe(
      true,
    )
  })
})
