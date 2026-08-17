/**
 * Maya — conteúdo estático (sem LLM, sem dados de negócio).
 * Fonte: `content/` (páginas + intents). Este ficheiro mantém os imports existentes.
 */

export {
  getMayaIntent,
  MAYA_CATALOG_INTENT_IDS,
  MAYA_CLIENT_CATALOG_INTENT_IDS,
  MAYA_LANDING_CATALOG_INTENT_IDS,
  MAYA_INTENTS,
  MAYA_MODULE_INTENT,
  MAYA_PAGES,
  resolveMayaPage,
} from '@/features/maya/content'
export type {
  MayaFieldHelp,
  MayaIntent,
  MayaNextStep,
  MayaPageGuide,
  MayaProblem,
} from '@/features/maya/content'
