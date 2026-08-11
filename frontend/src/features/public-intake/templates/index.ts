import { DefaultTemplate } from './default/DefaultTemplate'

/**
 * v9 — costura para múltiplos templates (ver plan file da sessão): hoje só
 * `default` existe, mas `PublicSiteConfig.templateKey` (persistido desde a
 * Fase 1) já permite adicionar um segundo template mais tarde sem migração
 * — só um componente novo + uma entrada aqui.
 */
export const TEMPLATE_REGISTRY = {
  default: DefaultTemplate,
} as const

export function resolveTemplate(templateKey: string | null | undefined) {
  return TEMPLATE_REGISTRY[templateKey as keyof typeof TEMPLATE_REGISTRY] || TEMPLATE_REGISTRY.default
}
