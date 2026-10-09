import type { PublicSiteConfig, PublicSiteSection } from '@/shared/types/firmPublicSite'
import type { MayaSetupAnswers, MayaSetupProposalV1 } from '@/infrastructure/api/contabil/mayaSetup'
import type { MayaSetupMediaState } from '@/features/maya/setup/MayaSetupMediaStep'

type PatchSection = { type: string; enabled?: boolean; content?: Record<string, unknown> }

function toneCopy(tone: 'formal' | 'friendly') {
  return tone === 'formal'
    ? { tagline: 'Contabilidade rigorosa e transparente', voice: 'presta' }
    : { tagline: 'Contabilidade clara e próxima', voice: 'apoia' }
}

function defaultFeatureItems(region: string, serviceKeys: string[]) {
  const items = [
    { title: 'Proximidade', description: `Equipa acessível em ${region} com respostas claras.` },
    { title: 'Processos digitais', description: 'Partilha de documentos e prazos organizados online.' },
  ]
  if (serviceKeys.some((k) => String(k).includes('irs'))) {
    items.push({ title: 'IRS e fiscalidade', description: 'Apoio em declarações e simulações, com revisão humana.' })
  }
  return items.slice(0, 6)
}

function buildDefaultPatchSections(input: {
  firmName: string
  region: string
  tone: 'formal' | 'friendly'
  brief: string
  specLine: string
  serviceKeys: string[]
}): PatchSection[] {
  const copy = toneCopy(input.tone)
  const aboutBody =
    input.brief ||
    `Escritório de contabilidade em ${input.region}, focado em acompanhamento próximo e processos digitais.`
  const voiceCap = `${copy.voice.charAt(0).toUpperCase()}${copy.voice.slice(1)}`
  return [
    {
      type: 'hero',
      enabled: true,
      content: {
        title: input.firmName.slice(0, 120),
        tagline: copy.tagline.slice(0, 160),
        bio: `${voiceCap} particulares e empresas em ${input.region}. ${input.specLine}`.slice(0, 2000),
      },
    },
    {
      type: 'about',
      enabled: true,
      content: { heading: 'Sobre o escritório', body: aboutBody.slice(0, 4000) },
    },
    {
      type: 'services',
      enabled: true,
      content: {
        heading: 'Serviços',
        body: 'Consultas e acompanhamento adaptados a particulares e empresas.'.slice(0, 4000),
      },
    },
    {
      type: 'features',
      enabled: true,
      content: {
        heading: 'Porquê connosco',
        items: defaultFeatureItems(input.region, input.serviceKeys),
      },
    },
    {
      type: 'process',
      enabled: true,
      content: {
        heading: 'Como funciona',
        steps: [
          { title: 'Contacto', description: 'Escolha o serviço ou envie uma mensagem pela página.' },
          { title: 'Recolha', description: 'Indique o essencial — o escritório pede documentos se necessário.' },
          { title: 'Acompanhamento', description: `O escritório ${copy.voice} até concluir o pedido.` },
        ],
      },
    },
    {
      type: 'faq',
      enabled: true,
      content: {
        items: [
          {
            question: 'Como marco uma consulta?',
            answer: 'Use os serviços disponíveis na página ou os contactos indicados pelo escritório.',
          },
          {
            question: 'Atendem empresas e particulares?',
            answer: `Sim — o escritório acompanha ambos em ${input.region} e online.`,
          },
          {
            question: 'Os valores incluem IVA?',
            answer: 'Os preços indicados na página seguem a informação de cada serviço; confirme com o escritório.',
          },
        ],
      },
    },
    {
      type: 'contact',
      enabled: true,
      content: {
        heading: 'Contacte-nos',
        body: 'Peça informações ou marque uma consulta pela página ou pelos contactos do escritório.'.slice(0, 4000),
      },
    },
  ]
}

export function buildLocalPatchFromAnswers(
  answers: Pick<
    MayaSetupAnswers,
    'countryCode' | 'tone' | 'specialties' | 'serviceCatalogKeys' | 'cityRegion' | 'ownerBrief'
  >,
  firmName: string,
): { seo?: { title?: string; description?: string }; theme?: Record<string, string>; sections: PatchSection[] } {
  const region =
    String(answers.cityRegion || '').trim() || (answers.countryCode === 'BR' ? 'Brasil' : 'Portugal')
  const tone = answers.tone === 'formal' ? 'formal' : 'friendly'
  const brief = String(answers.ownerBrief || '').trim().slice(0, 600)
  const specLine =
    Array.isArray(answers.specialties) && answers.specialties.length
      ? `Áreas: ${answers.specialties.slice(0, 5).join(', ')}.`
      : ''
  const serviceKeys = Array.isArray(answers.serviceCatalogKeys) ? answers.serviceCatalogKeys : []
  const name = firmName.trim() || 'O seu escritório'
  return {
    seo: {
      title: `${name} — contabilidade`.slice(0, 70),
      description: `Serviços de contabilidade em ${region}.`.slice(0, 200),
    },
    theme: { primaryColor: '#1e4d8c', secondaryColor: '#0ea5e9' },
    sections: buildDefaultPatchSections({ firmName: name, region, tone, brief, specLine, serviceKeys }),
  }
}

/** Espelha mergePublicSitePatch do backend (por type de secção). */
export function mergeMayaPublicSitePatch(existingDraft: PublicSiteConfig, patch: Record<string, unknown>): PublicSiteConfig {
  const base = structuredClone(existingDraft)
  const seo = patch.seo as PublicSiteConfig['seo'] | undefined
  const theme = patch.theme as PublicSiteConfig['theme'] | undefined
  const patchSections = patch.sections as PatchSection[] | undefined
  if (seo) base.seo = { ...base.seo, ...seo }
  if (theme) base.theme = { ...base.theme, ...theme }
  if (Array.isArray(patchSections)) {
    for (const pSec of patchSections) {
      const idx = base.sections.findIndex((s) => s.type === pSec.type)
      if (idx < 0) continue
      const prev = base.sections[idx]
      base.sections[idx] = {
        ...prev,
        enabled: pSec.enabled !== undefined ? pSec.enabled : prev.enabled,
        content: {
          ...(prev.content as Record<string, unknown>),
          ...(pSec.content || {}),
        },
      } as PublicSiteSection
    }
  }
  return base
}

type MediaRef = { id: string; storageKey: string; alt: string; url?: string | null }

export function mergeMayaMediaIntoDraft(draft: PublicSiteConfig, media: MayaSetupMediaState): PublicSiteConfig {
  const base = structuredClone(draft)
  if (!base.images) base.images = { hero: [], institutional: [], bySection: {} }
  const upsert = (list: MediaRef[], ref: MediaRef | null) => {
    if (!ref) return
    const idx = list.findIndex((i) => i.id === ref.id)
    const row = { id: ref.id, storageKey: ref.storageKey, alt: ref.alt || '', url: ref.url ?? null }
    if (idx >= 0) list[idx] = row
    else list.push(row)
  }
  if (media.heroImage) upsert(base.images.hero, media.heroImage)
  if (media.aboutImage) upsert(base.images.institutional, media.aboutImage)
  base.sections = base.sections.map((sec) => {
    if (sec.type === 'hero' && media.heroImage && 'imageIds' in sec.content) {
      return {
        ...sec,
        enabled: sec.enabled !== false,
        content: { ...sec.content, imageIds: [media.heroImage.id], showImage: true },
      }
    }
    if (sec.type === 'about' && media.aboutImage && 'imageIds' in sec.content) {
      return {
        ...sec,
        content: { ...sec.content, imageIds: [media.aboutImage.id], showImage: true },
      }
    }
    return sec
  })
  return base
}

export function buildMayaLivePreviewDraft(input: {
  baseDraft: PublicSiteConfig
  firmName: string
  answers: MayaSetupAnswers | null
  media: MayaSetupMediaState | null
  proposal: MayaSetupProposalV1 | null
  overlayDraft: PublicSiteConfig | null
}): PublicSiteConfig {
  let next = structuredClone(input.baseDraft)
  if (input.overlayDraft) {
    next = structuredClone(input.overlayDraft)
  }
  if (input.answers) {
    const local = buildLocalPatchFromAnswers(input.answers, input.firmName)
    next = mergeMayaPublicSitePatch(next, local)
  }
  if (input.proposal?.publicSitePatch) {
    next = mergeMayaPublicSitePatch(next, input.proposal.publicSitePatch as Record<string, unknown>)
  }
  if (input.media) {
    next = mergeMayaMediaIntoDraft(next, input.media)
  }
  return next
}
