/**
 * Maya — modelo de conteúdo estático (sem LLM, sem dados de negócio).
 * Página → resumo → opções → explicação → campos/acções → próximo passo.
 */

export type MayaFieldHelp = {
  id: string
  name: string
  meaning: string
  why?: string
  example?: string
  required?: boolean
  emptyConsequence?: string
  usedWhere?: string
  format?: string
  dependsOn?: string
}

export type MayaNextStep = {
  label: string
  intentId?: string
  deepLink?: string
}

export type MayaProblem = {
  id: string
  title: string
  answer: string
}

export type MayaIntent = {
  id: string
  title: string
  shortDescription: string
  answer: string
  steps: string[]
  deepLink: string
  relatedIntents: string[]
  /** Omissão = escritório. `client` = portal do cliente (Maya própria). */
  surface?: 'firm' | 'client'
  fields?: MayaFieldHelp[]
  nextSteps?: MayaNextStep[]
  commonProblems?: MayaProblem[]
  followUpPrompt?: string
  /** Substitui «Ir para {shortDescription}». */
  ctaLabel?: string
  /** Explicação visível a todos; CTA de configuração só para o responsável. */
  ownerOnly?: boolean
}

export type MayaPageGuide = {
  id: string
  pathPrefix: string
  /** Se definido, só corresponde com este query param. */
  search?: { key: string; value: string }
  /** Correspondência exacta do pathname (não herda sub-rotas). */
  exact?: boolean
  where: string
  summary: string
  audience: string
  goal: string
  firstTimeHint?: string
  emptyHint?: string
  topicIds: string[]
  primaryIntentId: string
}

export function defineIntent(intent: MayaIntent): MayaIntent {
  return intent
}
