import { COMMS_INTENTS } from '@/features/maya/content/intents/comms'
import { CORE_INTENTS } from '@/features/maya/content/intents/core'
import { CLIENT_HUB_INTENTS } from '@/features/maya/content/intents/clientHub'
import { CLIENT_INTENTS } from '@/features/maya/content/intents/clients'
import { IRS_INTENTS } from '@/features/maya/content/intents/irs'
import { OPS_INTENTS } from '@/features/maya/content/intents/operations'
import { SERVICE_INTENTS } from '@/features/maya/content/intents/services'
import { SETTINGS_INTENTS } from '@/features/maya/content/intents/settings'
import { PORTAL_CLIENT_INTENTS } from '@/features/maya/content/intents/portalClient'
import type { MayaIntent } from '@/features/maya/content/types'

export const MAYA_INTENTS: MayaIntent[] = [
  ...CORE_INTENTS,
  ...IRS_INTENTS,
  ...SERVICE_INTENTS,
  ...CLIENT_INTENTS,
  ...CLIENT_HUB_INTENTS,
  ...OPS_INTENTS,
  ...COMMS_INTENTS,
  ...SETTINGS_INTENTS,
  ...PORTAL_CLIENT_INTENTS,
]

/** Intent sugerido por módulo / ecrã (compatível com a Maya v1). */
export const MAYA_MODULE_INTENT: Record<string, string> = {
  dashboard: 'tour',
  settings: 'settings',
  'public-page': 'public-page',
  services: 'service',
  irs: 'irs-campaign',
  agenda: 'agenda',
  clients: 'clients',
  documents: 'documents',
  messages: 'messages',
  obligations: 'obligations',
  tasks: 'obligations',
  'fiscal-calendar': 'fiscal-calendar',
  payments: 'payments',
  billing: 'billing',
  alerts: 'alerts',
  news: 'news',
  help: 'human-support',
  support: 'human-support',
}

const INTENT_BY_ID = new Map(MAYA_INTENTS.map((intent) => [intent.id, intent]))

export function getMayaIntent(id: string): MayaIntent | undefined {
  return INTENT_BY_ID.get(id)
}

export { MAYA_PAGES, MAYA_CATALOG_INTENT_IDS, MAYA_CLIENT_CATALOG_INTENT_IDS } from '@/features/maya/content/pages'
export { resolveMayaPage } from '@/features/maya/content/resolvePage'
export type {
  MayaFieldHelp,
  MayaIntent,
  MayaNextStep,
  MayaPageGuide,
  MayaProblem,
} from '@/features/maya/content/types'
