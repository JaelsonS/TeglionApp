/**
 * Camada de apresentação do estado de publicação de um serviço.
 * Não altera o modelo de dados (isActive / isPubliclyListed / slug).
 */

export type ServicePublishPresentationId = 'inactive' | 'draft' | 'ready' | 'published'

export type ServicePublishPresentation = {
  id: ServicePublishPresentationId
  /** Rótulo curto (badge) */
  label: string
  /** Frase de apoio para o contabilista */
  description: string
  /** Sugestão de CTA quando aplicável */
  ctaHint?: string
}

type ServiceLike = {
  isActive?: boolean
  isPubliclyListed?: boolean
  slug?: string | null
  name?: string
}

/**
 * Distingue:
 * - Inactivo: não disponível no escritório
 * - Rascunho: activo mas sem publicação
 * - Pronto: marcado para o site mas falta slug (ou bloqueio de formulário tratado no save)
 * - Publicado: no site (isPubliclyListed + slug)
 */
export function getServicePublishPresentation(service: ServiceLike): ServicePublishPresentation {
  const active = service.isActive !== false
  const listed = Boolean(service.isPubliclyListed)
  const hasSlug = Boolean(service.slug && String(service.slug).trim())

  if (!active) {
    return {
      id: 'inactive',
      label: 'Inactivo',
      description: 'Este serviço está desactivado — não aparece para a equipa nem na página pública.',
      ctaHint: 'Activar serviço',
    }
  }

  if (listed && hasSlug) {
    return {
      id: 'published',
      label: 'Publicado',
      description: 'Este serviço já pode ser visto pelos seus potenciais clientes na página pública.',
      ctaHint: 'Ver página do serviço',
    }
  }

  if (listed && !hasSlug) {
    return {
      id: 'ready',
      label: 'Quase publicado',
      description: 'Marcou para aparecer no site, mas falta definir o endereço público (slug) e guardar.',
      ctaHint: 'Definir endereço e publicar',
    }
  }

  return {
    id: 'draft',
    label: 'Só interno',
    description: 'Este serviço ainda não está visível para os seus potenciais clientes.',
    ctaHint: 'Publicar serviço',
  }
}

export function countServicePublishStats(services: ServiceLike[]) {
  let active = 0
  let published = 0
  let internal = 0
  for (const s of services) {
    const p = getServicePublishPresentation(s)
    if (p.id !== 'inactive') active += 1
    if (p.id === 'published') published += 1
    if (p.id === 'draft' || p.id === 'ready') internal += 1
  }
  return { active, published, internal, total: services.length }
}
