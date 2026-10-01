import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { firmPublicSiteApi } from '@/infrastructure/api/contabil/firmPublicSite'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import { contabilConsultationsApi, contabilPublicApi } from '@/infrastructure/api'
import type { FirmSettingsBundle } from '@/shared/types/firmSettings'
import type { PublicSiteConfig, PublicSiteSection } from '@/shared/types/firmPublicSite'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import type { FirmBookingSettings } from '@/shared/types/contabil'
import { getErrorMessage } from '@/shared/utils/errors'
import { resolveFirmBrandingCssVars } from '@/shared/utils/firmBranding'
import { DefaultTemplate } from '@/features/public-intake/templates/default/DefaultTemplate'
import {
  AboutEditor,
  ChromeSectionEditor,
  ContactEditor,
  FaqEditor,
  FeaturesEditor,
  HeroEditor,
  ProcessEditor,
  ServicesHeadingEditor,
  PublicSiteLogoCard,
  PublicSiteSectionAlignField,
} from './sectionEditors'
import { resolvePublicSitePreviewZoneLogoUrl } from './publicSitePreviewLogo'
import {
  PublicSiteEditorPreviewFrame,
  publicSiteEditorPreviewCanvasPx,
  type PublicSiteEditorPreviewDevice,
} from './PublicSiteEditorPreviewFrame'
import { resolvePublicSiteImageUrl } from '@/features/public-intake/publicSiteImageResolve'
import type { PublicSiteLogoSource } from '@/shared/types/firmPublicSite'
import { PublicSiteSectionsList } from './PublicSiteSectionsList'
import {
  normalizePublicSiteSectionsOrder,
  reindexPublicSiteSectionsOrder,
  reorderPublicSiteSections,
} from './publicSiteSectionOrder'
import {
  addCustomCatalogSection,
  removePublicSiteSection,
} from './publicSiteSectionFactory'
import { applyPageBackgroundColor, parsePublicSiteHex } from './publicSitePageBackground'
import { PublicSitePublishReadinessChecklist } from './PublicSitePublishReadinessChecklist'
import {
  evaluatePublicSitePublishReadiness,
  publicSiteSectionCardDomId,
  type PublicSitePublishReadinessItem,
} from './publicSitePublishReadiness'
import { resolvePublicSiteSectionVisitorSummary } from './publicSiteSectionVisitorSummary'
import { usePublicSiteEditorPreviewAssist } from './usePublicSiteEditorPreviewAssist'
import { PublicSiteEditorFold } from './PublicSiteEditorFold'
import { PublicSiteLinkPublishPanel } from './PublicSiteLinkPublishPanel'
import { PublicSiteEditorDeviceChrome } from './PublicSiteEditorDeviceChrome'
import { PublicSiteExtrasPanel } from './PublicSiteExtrasPanel'
import { evaluatePublicSiteLegalGaps, publicSiteLegalFieldsDomId } from './publicSiteLegalCompliance'

const SECTION_LABELS: Record<PublicSiteSection['type'], string> = {
  header: 'Barra do topo',
  hero: 'Destaque principal',
  about: 'Sobre o escritório',
  services: 'Serviços com marcação online',
  bookingServices: 'Serviços por formulário (sem horário)',
  features: 'Diferenciais',
  process: 'Como funciona',
  faq: 'Perguntas frequentes',
  contact: 'Contactos',
  footer: 'Rodapé',
}

const SECTION_HINTS: Record<PublicSiteSection['type'], string> = {
  header: 'Alinhamento da marca, cores · menu hamburger em telemóvel/tablet',
  hero: 'Alinhamento, imagem de fundo, texto e botões',
  about: 'Alinhamento, texto, foto e botões',
  services: 'Título opcional · destaques · grelha · ordem (marcação online)',
  bookingServices: 'Título opcional · destaques · grelha · ordem (formulário, sem horário)',
  features: 'Alinhamento e pontos fortes',
  process: 'Alinhamento e passos',
  faq: 'Alinhamento e perguntas',
  contact: 'Alinhamento, contactos e botões',
  footer: 'Redes sociais, contactos (se Contactos off), cores e alinhamento',
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HEX_RE = /^#[0-9a-f]{6}$/i

type Props = {
  bundle: FirmSettingsBundle
  onFirmUpdated?: () => void
}

export function PublicSiteEditor({ bundle, onFirmUpdated }: Props) {
  const firmSlug = bundle.firm.slug || ''
  const canEditLink = Boolean(bundle.capabilities?.canCloseAccount) // owner-only (same as close account)
  const [draft, setDraft] = useState<PublicSiteConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [slugDraft, setSlugDraft] = useState(firmSlug)
  const [savingSlug, setSavingSlug] = useState(false)
  const [publicDisplayName, setPublicDisplayName] = useState(bundle.publicProfile.displayName ?? '')
  const [savingDisplayName, setSavingDisplayName] = useState(false)
  /** Por secção (key). Ausente = fechado — a contabilista abre só o que está a editar. */
  const [sectionOpenState, setSectionOpenState] = useState<Record<string, boolean>>({})
  const [previewDevice, setPreviewDevice] = useState<PublicSiteEditorPreviewDevice>('tablet')
  const [linkPublishOpen, setLinkPublishOpen] = useState(false)
  const [extrasOpen, setExtrasOpen] = useState(false)
  const [legalPublishAckChecked, setLegalPublishAckChecked] = useState(false)

  const isSectionEditorOpen = (section: PublicSiteSection) => {
    if (Object.prototype.hasOwnProperty.call(sectionOpenState, section.key)) {
      return sectionOpenState[section.key]
    }
    return false
  }

  const collapseAllSections = () => {
    const next: Record<string, boolean> = {}
    for (const s of draft?.sections || []) next[s.key] = false
    setSectionOpenState(next)
  }

  const toggleSectionOpen = (section: PublicSiteSection) => {
    setSectionOpenState((prev) => {
      const currently = Object.prototype.hasOwnProperty.call(prev, section.key) ? prev[section.key] : false
      return { ...prev, [section.key]: !currently }
    })
  }

  useEffect(() => {
    setSlugDraft(firmSlug)
  }, [firmSlug])

  useEffect(() => {
    setPublicDisplayName(bundle.publicProfile.displayName ?? '')
  }, [bundle.publicProfile.displayName])

  const siteQuery = useQuery({
    queryKey: ['firm-public-site'],
    queryFn: () => firmPublicSiteApi.get(),
    staleTime: 10_000,
  })

  const servicesQuery = useQuery({
    queryKey: ['public-firm-services-preview', firmSlug],
    queryFn: () => contabilPublicApi.getPublicFirmServices(firmSlug),
    enabled: Boolean(firmSlug),
  })

  const bookingQuery = useQuery({
    queryKey: ['booking-settings-summary'],
    queryFn: () => contabilConsultationsApi.getBookingSettings() as Promise<{ booking: FirmBookingSettings }>,
  })

  const previewAssistSections = draft ? reindexPublicSiteSectionsOrder(draft.sections) : []

  const openSectionFromPreview = useCallback((sectionKey: string) => {
    setSectionOpenState((prev) => ({ ...prev, [sectionKey]: true }))
  }, [])

  usePublicSiteEditorPreviewAssist({
    enabled: Boolean(draft && !siteQuery.isLoading),
    sections: previewAssistSections,
    labels: SECTION_LABELS,
    onOpenSection: openSectionFromPreview,
  })

  useEffect(() => {
    if (siteQuery.data && !draft) {
      const incoming = siteQuery.data.draft
      setDraft({
        ...incoming,
        sections: reindexPublicSiteSectionsOrder(incoming.sections || []),
        theme: {
          primaryColor: incoming.theme?.primaryColor ?? null,
          secondaryColor: incoming.theme?.secondaryColor ?? null,
          textColor: incoming.theme?.textColor ?? null,
          backgroundColor: incoming.theme?.backgroundColor ?? null,
          surfaceColor: incoming.theme?.surfaceColor ?? null,
          mutedTextColor: incoming.theme?.mutedTextColor ?? null,
          headerLogoSource: incoming.theme?.headerLogoSource ?? 'firm',
          heroLogoSource: incoming.theme?.heroLogoSource ?? 'firm',
          logoStorageKey: incoming.theme?.logoStorageKey ?? null,
          headerLogoStorageKey: incoming.theme?.headerLogoStorageKey ?? null,
          heroLogoStorageKey: incoming.theme?.heroLogoStorageKey ?? null,
          headerLogoUrl: incoming.theme?.headerLogoUrl ?? null,
          heroLogoUrl: incoming.theme?.heroLogoUrl ?? null,
        },
        images: {
          hero: incoming.images?.hero ?? [],
          institutional: incoming.images?.institutional ?? [],
          bySection: incoming.images?.bySection ?? {},
        },
      })
    }
  }, [siteQuery.data, draft])

  const patchSectionContent = (key: string, content: PublicSiteSection['content']) => {
    if (!draft) return
    setDraft({
      ...draft,
      sections: draft.sections.map((s) => (s.key === key ? ({ ...s, content } as PublicSiteSection) : s)),
    })
  }

  const toggleSection = (key: string, enabled: boolean) => {
    if (!draft) return
    setDraft({ ...draft, sections: draft.sections.map((s) => (s.key === key ? { ...s, enabled } : s)) })
  }

  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null)

  const uploadSectionMedia = async (
    section: PublicSiteSection,
    role: 'content' | 'background',
    file: File,
  ) => {
    setUploadingImageKey(`${section.key}-${role}`)
    try {
      let slot: 'hero' | 'institutional' | 'section' = 'section'
      if (section.type === 'hero' && role === 'content') slot = 'hero'
      else if (section.type === 'about' && role === 'content') slot = 'institutional'
      else slot = 'section'
      const image = await firmPublicSiteApi.uploadImage(slot, file, slot === 'section' ? section.key : undefined)
      setDraft((prev) => {
        if (!prev) return prev
        const bySection = { ...(prev.images.bySection || {}) }
        const images =
          slot === 'section'
            ? {
                ...prev.images,
                bySection: { ...bySection, [section.key]: [...(bySection[section.key] || []), image] },
              }
            : { ...prev.images, [slot]: [...prev.images[slot], image] }
        const sections = prev.sections.map((s) => {
          if (s.key !== section.key) return s
          if (role === 'background' && 'backgroundImageId' in s.content) {
            return {
              ...s,
              content: { ...s.content, backgroundImageId: image.id, showBackgroundImage: true },
            } as PublicSiteSection
          }
          if ('imageIds' in s.content) {
            return { ...s, content: { ...s.content, imageIds: [image.id] } } as PublicSiteSection
          }
          return s
        })
        return { ...prev, images, sections }
      })
    } catch (err) {
      toast.error('Não foi possível enviar a imagem', { description: getErrorMessage(err) })
    } finally {
      setUploadingImageKey(null)
    }
  }

  const removeSectionMedia = (section: PublicSiteSection, role: 'content' | 'background') => {
    setDraft((prev) => {
      if (!prev) return prev
      const content = section.content
      if (role === 'background' && 'backgroundImageId' in content) {
        const bgId = content.backgroundImageId
        const bySection = { ...(prev.images.bySection || {}) }
        if (bgId && bySection[section.key]) {
          bySection[section.key] = bySection[section.key].filter((img) => img.id !== bgId)
        }
        return {
          ...prev,
          images: { ...prev.images, bySection },
          sections: prev.sections.map((s) =>
            s.key === section.key && 'backgroundImageId' in s.content
              ? ({ ...s, content: { ...s.content, backgroundImageId: null, showBackgroundImage: false } } as PublicSiteSection)
              : s,
          ),
        }
      }
      if (!('imageIds' in content)) return prev
      const imageId = content.imageIds?.[0]
      let slot: 'hero' | 'institutional' = section.type === 'about' ? 'institutional' : 'hero'
      if (section.type !== 'hero' && section.type !== 'about') {
        const bySection = { ...(prev.images.bySection || {}) }
        bySection[section.key] = (bySection[section.key] || []).filter((img) => img.id !== imageId)
        return {
          ...prev,
          images: { ...prev.images, bySection },
          sections: prev.sections.map((s) =>
            s.key === section.key && 'imageIds' in s.content
              ? ({ ...s, content: { ...s.content, imageIds: [] } } as PublicSiteSection)
              : s,
          ),
        }
      }
      return {
        ...prev,
        images: { ...prev.images, [slot]: prev.images[slot].filter((img) => img.id !== imageId) },
        sections: prev.sections.map((s) =>
          s.key === section.key && 'imageIds' in s.content
            ? ({ ...s, content: { ...s.content, imageIds: [] } } as PublicSiteSection)
            : s,
        ),
      }
    })
  }

  function resolveSectionContentImageUrl(section: PublicSiteSection): string | null {
    if (!draft || !('imageIds' in section.content)) return null
    const id = section.content.imageIds?.[0]
    if (!id) return null
    if (section.type === 'hero') return draft.images.hero.find((img) => img.id === id)?.url || null
    if (section.type === 'about') {
      return (
        draft.images.institutional.find((img) => img.id === id)?.url ||
        resolvePublicSiteImageUrl(id, draft.images, section.key)
      )
    }
    return resolvePublicSiteImageUrl(id, draft.images, section.key)
  }

  function resolveSectionBackgroundImageUrl(section: PublicSiteSection): string | null {
    if (!draft || !('backgroundImageId' in section.content)) return null
    return resolvePublicSiteImageUrl(section.content.backgroundImageId, draft.images, section.key)
  }

  const patchThemeLogoSource = async (zone: 'header' | 'hero', source: PublicSiteLogoSource) => {
    if (!draft) return
    const next: PublicSiteConfig = {
      ...draft,
      theme: {
        ...draft.theme,
        ...(zone === 'header' ? { headerLogoSource: source } : { heroLogoSource: source }),
      },
    }
    setDraft(next)
    try {
      const saved = await firmPublicSiteApi.saveDraft(next)
      setDraft(saved.draft)
    } catch (err) {
      toast.error('Não foi possível guardar a opção de logótipo', { description: getErrorMessage(err) })
    }
  }

  const withReindexedSections = (config: PublicSiteConfig): PublicSiteConfig => ({
    ...config,
    sections: reindexPublicSiteSectionsOrder(config.sections),
  })

  const onSaveDraft = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const normalized = withReindexedSections(draft)
      const result = await firmPublicSiteApi.saveDraft(normalized)
      setDraft(withReindexedSections(result.draft))
      toast.success('Rascunho guardado.')
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const onPreview = async () => {
    setPreviewing(true)
    try {
      if (draft) {
        const normalized = withReindexedSections(draft)
        await firmPublicSiteApi.saveDraft(normalized)
        setDraft(normalized)
      }
      const { previewToken } = await firmPublicSiteApi.regeneratePreviewToken()
      window.open(`/${encodeURIComponent(firmSlug)}?preview=${encodeURIComponent(previewToken)}`, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error('Não foi possível gerar a pré-visualização', { description: getErrorMessage(err) })
    } finally {
      setPreviewing(false)
    }
  }

  const onPublish = async () => {
    setPublishing(true)
    try {
      if (draft) {
        const normalized = withReindexedSections(draft)
        await firmPublicSiteApi.saveDraft(normalized)
        setDraft(normalized)
      }
      const legalGapsNow = draft ? evaluatePublicSiteLegalGaps(draft) : []
      await firmPublicSiteApi.publish(
        legalGapsNow.length > 0
          ? {
              legalPublishAcknowledgement: {
                accepted: true,
                missingItems: legalGapsNow.map((g) => g.id),
              },
            }
          : undefined,
      )
      toast.success('Página pública publicada.')
      setConfirmPublishOpen(false)
      setLegalPublishAckChecked(false)
      void siteQuery.refetch()
    } catch (err) {
      toast.error('Não foi possível publicar', { description: getErrorMessage(err) })
    } finally {
      setPublishing(false)
    }
  }

  const onSaveSlug = async () => {
    const next = slugDraft.trim().toLowerCase()
    if (!next || next === firmSlug) return
    setSavingSlug(true)
    try {
      await firmSettingsApi.patchFirm({ slug: next })
      toast.success('Link público actualizado.')
      onFirmUpdated?.()
    } catch (err) {
      toast.error('Não foi possível alterar o link', { description: getErrorMessage(err) })
    } finally {
      setSavingSlug(false)
    }
  }

  const onSavePublicDisplayName = async () => {
    const next = publicDisplayName.trim()
    const current = (bundle.publicProfile.displayName || '').trim()
    if (next === current) return
    setSavingDisplayName(true)
    try {
      await firmSettingsApi.patchPublicProfile({ displayName: next || null })
      toast.success('Nome público actualizado.')
      onFirmUpdated?.()
    } catch (err) {
      toast.error('Não foi possível guardar o nome público', { description: getErrorMessage(err) })
    } finally {
      setSavingDisplayName(false)
    }
  }

  const onResetSite = async () => {
    setResetting(true)
    try {
      const result = await firmPublicSiteApi.reset()
      setDraft({
        ...result.draft,
        sections: normalizePublicSiteSectionsOrder(result.draft.sections || []),
      })
      setConfirmResetOpen(false)
      toast.success('Página apagada. Pode configurar de novo do zero.')
      void siteQuery.refetch()
    } catch (err) {
      toast.error('Não foi possível apagar a página', { description: getErrorMessage(err) })
    } finally {
      setResetting(false)
    }
  }

  const onReorderSections = (activeKey: string, overKey: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, sections: reorderPublicSiteSections(prev.sections, activeKey, overKey) }
    })
  }

  const onApplyRecommendedOrder = () => {
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, sections: normalizePublicSiteSectionsOrder(prev.sections) }
    })
    toast.success('Ordem recomendada aplicada.')
  }

  const onAddSection = () => {
    if (!draft) return
    const result = addCustomCatalogSection(draft.sections)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    setDraft({ ...draft, sections: reindexPublicSiteSectionsOrder(result.sections) })
    setSectionOpenState((prev) => ({ ...prev, [result.focusKey]: true }))
    toast.success('Secção adicionada — edite o título, as cores e os botões')
  }

  const onRemoveSection = (key: string) => {
    if (!draft) return
    const result = removePublicSiteSection(draft.sections, key)
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    setDraft({ ...draft, sections: reindexPublicSiteSectionsOrder(result.sections) })
    setSectionOpenState((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    toast.success('Secção removida')
  }

  const legalGaps = useMemo(() => (draft ? evaluatePublicSiteLegalGaps(draft) : []), [draft])

  const focusLegalFields = useCallback(() => {
    setExtrasOpen(true)
    requestAnimationFrame(() => {
      document.getElementById(publicSiteLegalFieldsDomId())?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  if (siteQuery.isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const previewServices: PublicFirmServiceSummary[] = servicesQuery.data?.items || []
  const booking = bookingQuery.data?.booking
  const previewFirmName =
    publicDisplayName.trim() || bundle.publicProfile.displayName?.trim() || bundle.firm.name
  const sortedSections = reindexPublicSiteSectionsOrder(draft.sections)

  const editorPreviewHighlightKeys = sortedSections.filter(isSectionEditorOpen).map((s) => s.key)

  const publishReadinessItems = evaluatePublicSitePublishReadiness({
    firmSlug,
    config: draft,
    services: previewServices,
    firmContact: {
      email: bundle.contact?.email ?? null,
      phone: bundle.contact?.phone ?? null,
      address: bundle.contact?.address ?? null,
    },
  })

  const onPublishReadinessFocus = (item: PublicSitePublishReadinessItem) => {
    if (item.focus.kind === 'identity') {
      setLinkPublishOpen(true)
      document.getElementById('public-site-identity')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (item.focus.kind === 'servicesCatalog') {
      window.location.assign('/app/firm/services')
      return
    }
    const key = item.focus.sectionKey
    setSectionOpenState((prev) => ({ ...prev, [key]: true }))
    requestAnimationFrame(() => {
      document.getElementById(publicSiteSectionCardDomId(key))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const previewRenderCtx = {
    firmSlug,
    firmName: previewFirmName,
    logoUrl: resolvePublicSitePreviewZoneLogoUrl(draft, 'header', bundle.logoUrl),
    headerLogoUrl: resolvePublicSitePreviewZoneLogoUrl(draft, 'header', bundle.logoUrl),
    heroLogoUrl: resolvePublicSitePreviewZoneLogoUrl(draft, 'hero', bundle.logoUrl),
    services: previewServices,
    contact: bundle.contact,
    showPrices: draft.showPrices !== false,
    complaintsBookUrl: draft.complaintsBookUrl,
    complaintsBookLabel: draft.complaintsBookLabel,
    praiseUrl: draft.praiseUrl,
    praiseLabel: draft.praiseLabel,
    praiseContact: draft.praiseContact,
    openInternalLinksInNewTab: true,
    showTeglionCredit: false,
    useEditorHeroFrame: true,
    editorPreviewHighlightKeys,
  }

  const previewPanel = <DefaultTemplate config={draft} ctx={previewRenderCtx} />

  const previewSurfaceStyle = {
    ...resolveFirmBrandingCssVars({
      primaryColor: draft.theme.primaryColor,
      secondaryColor: draft.theme.secondaryColor,
      textColor: draft.theme.textColor,
      backgroundColor: draft.theme.backgroundColor,
      surfaceColor: draft.theme.surfaceColor,
      mutedTextColor: draft.theme.mutedTextColor,
    }),
    ...(parsePublicSiteHex(draft.theme.backgroundColor)
      ? { backgroundColor: parsePublicSiteHex(draft.theme.backgroundColor)! }
      : { backgroundColor: 'hsl(var(--background))' }),
  } as CSSProperties

  const linkPublishClosedSummary = [
    firmSlug ? `teglion.com/${firmSlug}` : 'Defina o link público',
    siteQuery.data?.publishedAt ? 'Publicado' : 'Rascunho',
  ].join(' · ')

  return (
    <div className="cb-public-site-editor-root space-y-6">
      <section
        className="rounded-xl border border-brand/25 bg-gradient-to-br from-brand/[0.07] via-card to-card p-4 shadow-sm"
        aria-label="Pronto para publicar"
      >
        <PublicSitePublishReadinessChecklist
          items={publishReadinessItems}
          legalGaps={legalGaps}
          onFocus={onPublishReadinessFocus}
          onFocusLegal={focusLegalFields}
        />
      </section>

      <PublicSiteEditorFold
        id="public-site-identity"
        title="A · Link e publicar"
        closedSummary={linkPublishClosedSummary}
        hint="Endereço teglion.com/…, nome na barra do site e botões para guardar, pré-visualizar ou publicar."
        open={linkPublishOpen}
        onOpenChange={setLinkPublishOpen}
        className="border-brand/15 bg-card/50"
      >
        <PublicSiteLinkPublishPanel
          publishedAt={siteQuery.data?.publishedAt}
          firmSlug={firmSlug}
          slugDraft={slugDraft}
          onSlugDraftChange={setSlugDraft}
          savingSlug={savingSlug}
          onSaveSlug={() => void onSaveSlug()}
          canEditLink={canEditLink}
          publicDisplayName={publicDisplayName}
          onPublicDisplayNameChange={setPublicDisplayName}
          savingDisplayName={savingDisplayName}
          onSaveDisplayName={() => void onSavePublicDisplayName()}
          firmNameFallback={bundle.firm.name || ''}
          saving={saving}
          previewing={previewing}
          publishing={publishing}
          resetting={resetting}
          onSaveDraft={() => void onSaveDraft()}
          onPreview={() => void onPreview()}
          onOpenPublishConfirm={() => setConfirmPublishOpen(true)}
          onOpenResetConfirm={() => setConfirmResetOpen(true)}
        />
      </PublicSiteEditorFold>

      <div className="cb-public-site-editor-grid">
        <div className="cb-public-site-editor-main order-1 min-w-0 space-y-4">
          <section className="space-y-3 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              B · Secções
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={onAddSection}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Mais uma lista de serviços (catálogo)
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={collapseAllSections}>
                Recolher todas
              </Button>
              <button
                type="button"
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={onApplyRecommendedOrder}
              >
                Ordem recomendada
              </button>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Abra <span className="font-medium text-foreground">só a secção</span> que está a editar (ex.: Destaque
            principal). Em cada secção, o bloco{' '}
            <span className="font-medium text-foreground">Alinhamento do conteúdo</span> (esquerda / centro / direita)
            fica no topo. Arraste à esquerda para reordenar. A pré-visualização à direita simula telemóvel/tablet — aí vê
            o menu hamburger.
          </p>
          <PublicSiteSectionsList
            sections={sortedSections}
            labels={SECTION_LABELS}
            hints={SECTION_HINTS}
            isOpen={isSectionEditorOpen}
            onToggleOpen={toggleSectionOpen}
            onToggleEnabled={(key, enabled) => {
              toggleSection(key, enabled)
              if (enabled) {
                setSectionOpenState((prev) => ({ ...prev, [key]: true }))
              }
            }}
            onReorder={onReorderSections}
            onRemove={onRemoveSection}
            visitorSummary={(section) => resolvePublicSiteSectionVisitorSummary(section, previewServices)}
            renderEditor={(section) => (
              <div className="space-y-3">
                <PublicSiteSectionAlignField
                  content={section.content}
                  variant={
                    section.type === 'hero'
                      ? 'hero'
                      : section.type === 'header' || section.type === 'footer'
                        ? 'chrome'
                        : 'section'
                  }
                  onChange={(next) => patchSectionContent(section.key, next as PublicSiteSection['content'])}
                />
                <SectionEditorSwitch
                  section={section}
                  onChange={(content) => patchSectionContent(section.key, content)}
                  publicDisplayName={previewFirmName}
                  services={previewServices}
                  officePhone={bundle.contact?.phone}
                  officeContact={bundle.contact}
                  socialWhatsapp={draft.socialLinks?.whatsapp}
                  bookingFilter={
                    section.type === 'services' ? true : section.type === 'bookingServices' ? false : undefined
                  }
                  imageUrl={resolveSectionContentImageUrl(section)}
                  backgroundImageUrl={resolveSectionBackgroundImageUrl(section)}
                  uploadingImage={uploadingImageKey === `${section.key}-content`}
                  uploadingBackgroundImage={uploadingImageKey === `${section.key}-background`}
                  onUploadImage={(file: File) => void uploadSectionMedia(section, 'content', file)}
                  onRemoveImage={() => removeSectionMedia(section, 'content')}
                  onUploadBackgroundImage={(file: File) => void uploadSectionMedia(section, 'background', file)}
                  onRemoveBackgroundImage={() => removeSectionMedia(section, 'background')}
                />
                {section.custom ? (
                  <div className="flex justify-end border-t border-border/40 pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveSection(section.key)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Apagar esta secção
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          />
          </section>
        </div>

        <aside className="cb-public-site-editor-aside order-2 min-w-0">
          <div className="cb-public-site-editor-preview-panel">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pré-visualização ao vivo
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Simulação por <span className="font-medium text-foreground">largura real</span> do dispositivo — em telemóvel
                e tablet vê o menu <span className="font-medium text-foreground">☰</span> como o visitante. Para testar
                cliques e scroll completo, use{' '}
                <span className="font-medium text-foreground">Abrir numa nova aba</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['mobile', 'Telemóvel'],
                  ['tablet', 'Tablet'],
                  ['desktop', 'Desktop'],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  variant={previewDevice === id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => setPreviewDevice(id)}
                >
                  {label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0"
                disabled={previewing || !firmSlug}
                onClick={() => void onPreview()}
              >
                {previewing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                )}
                Abrir numa nova aba
              </Button>
            </div>
          </div>
          <div
            key={`preview-bg-${draft.theme.backgroundColor || 'default'}-${draft.theme.surfaceColor || 'surface'}-${previewDevice}`}
            className="cb-public-site-editor-preview-scroll cb-public-site-editor-preview-scroll--device rounded-lg border border-border/50 shadow-sm"
          >
            <PublicSiteEditorDeviceChrome device={previewDevice} screenStyle={previewSurfaceStyle}>
              <PublicSiteEditorPreviewFrame
                canvasWidthPx={publicSiteEditorPreviewCanvasPx(previewDevice)}
                inDeviceChrome
              >
                {previewPanel}
              </PublicSiteEditorPreviewFrame>
            </PublicSiteEditorDeviceChrome>
          </div>
          </div>
        </aside>
      </div>

      <PublicSiteEditorFold
        id="public-site-extras"
        title="C · Marca e extras"
        closedSummary="Logótipos, cores, SEO, agendamento, termos e preços na página"
        hint="Logótipos, cores da página, SEO, horários, termos legais e opções de preços."
        open={extrasOpen}
        onOpenChange={setExtrasOpen}
        className="bg-muted/15"
      >
        <PublicSiteExtrasPanel
          firmSlug={firmSlug ?? ''}
          previewFirmName={previewFirmName}
          draft={draft}
          onDraftChange={setDraft}
          booking={booking}
          weekdayLabels={WEEKDAY_LABELS}
          logoSection={
            <PublicSiteLogoCard
              embedded
              draft={draft}
              firmLogoUrl={bundle.logoUrl ?? null}
              readOnly={!canEditLink}
              onDraftUpdate={setDraft}
              onLogoSourceChange={(zone, source) => void patchThemeLogoSource(zone, source)}
            />
          }
          pageColorsSection={<PageThemeColors draft={draft} onChange={setDraft} embedded />}
          themeEditorSection={<ThemeEditor draft={draft} onChange={setDraft} embedded />}
        />
      </PublicSiteEditorFold>

      <AlertDialog
        open={confirmPublishOpen}
        onOpenChange={(open: boolean) => {
          setConfirmPublishOpen(open)
          if (!open) setLegalPublishAckChecked(false)
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar página pública?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  A partir de agora, teglion.com/{firmSlug} passa a mostrar esta versão a qualquer visitante. O botão
                  Publicar também guarda o rascunho actual automaticamente.
                </p>
                {legalGaps.length > 0 ? (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-amber-950 dark:text-amber-100">
                    <p className="font-medium text-foreground">Documentos legais por completar</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-[13px]">
                      {legalGaps.map((g) => (
                        <li key={g.id}>{g.label}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[12px] leading-relaxed">
                      Pode publicar na mesma, mas deve assumir a responsabilidade legal do escritório. A{' '}
                      <span className="font-medium">Teglion</span> (produto da{' '}
                      <span className="font-medium">AfDigital — Soluções Tecnológicas</span>) não presta aconselhamento
                      jurídico nem responde pela ausência de Livro de Reclamações, Termos ou Política de Privacidade
                      adequados.
                    </p>
                    <label className="mt-3 flex cursor-pointer items-start gap-2 text-[12px] leading-snug">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-border"
                        checked={legalPublishAckChecked}
                        onChange={(e) => setLegalPublishAckChecked(e.target.checked)}
                      />
                      <span>
                        Declaro, em nome do escritório, que assumo a responsabilidade pelo conteúdo legal desta página
                        pública e autorizo a publicação mesmo com os itens acima por completar. Registo esta aceitação
                        nos logs do Teglion.
                      </span>
                    </label>
                  </div>
                ) : (
                  <p className="text-[12px]">
                    Livro de Reclamações e políticas do escritório estão indicados no rascunho. Ao partilhar o link, a
                    miniatura usa o destaque ou o logótipo do site — não a imagem comercial do Teglion.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="primary"
              disabled={publishing || (legalGaps.length > 0 && !legalPublishAckChecked)}
              loading={publishing}
              onClick={() => void onPublish()}
            >
              Publicar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar a página e recomeçar?</AlertDialogTitle>
            <AlertDialogDescription>
              Isto remove o rascunho e a versão publicada. O link público fica sem conteúdo até configurar e
              publicar de novo. Os serviços e o Stripe Connect não são afectados. Esta acção não se pode
              desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onResetSite()}
            >
              {resetting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Apagar tudo e recomeçar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SectionEditorSwitch({
  section,
  onChange,
  imageUrl,
  backgroundImageUrl,
  uploadingImage,
  uploadingBackgroundImage,
  onUploadImage,
  onRemoveImage,
  onUploadBackgroundImage,
  onRemoveBackgroundImage,
  services,
  officePhone,
  officeContact,
  publicDisplayName,
  socialWhatsapp,
  bookingFilter,
}: {
  section: PublicSiteSection
  onChange: (content: PublicSiteSection['content']) => void
  imageUrl: string | null
  backgroundImageUrl?: string | null
  uploadingImage: boolean
  uploadingBackgroundImage?: boolean
  onUploadImage: (file: File) => void
  onRemoveImage: () => void
  onUploadBackgroundImage?: (file: File) => void
  onRemoveBackgroundImage?: () => void
  services: PublicFirmServiceSummary[]
  officePhone?: string | null
  officeContact?: { email?: string | null; phone?: string | null; address?: string | null }
  publicDisplayName?: string
  socialWhatsapp?: string | null
  /** true = só com agendamento; false = só sem agendamento */
  bookingFilter?: boolean
}) {
  switch (section.type) {
    case 'hero':
      return (
        <HeroEditor
          content={section.content}
          onChange={onChange}
          imageUrl={imageUrl}
          uploadingImage={uploadingImage}
          onUploadImage={onUploadImage}
          onRemoveImage={onRemoveImage}
          services={services}
          officePhone={officePhone}
          socialWhatsapp={socialWhatsapp}
          publicDisplayName={publicDisplayName}
        />
      )
    case 'about':
      return (
        <AboutEditor
          content={section.content}
          onChange={onChange}
          imageUrl={imageUrl}
          uploadingImage={uploadingImage}
          onUploadImage={onUploadImage}
          onRemoveImage={onRemoveImage}
          services={services}
          officePhone={officePhone}
          socialWhatsapp={socialWhatsapp}
          sectionMedia={{
            content: section.content,
            onChange,
            contentImageUrl: imageUrl,
            backgroundImageUrl: backgroundImageUrl ?? null,
            uploadingContent: uploadingImage,
            uploadingBackground: uploadingBackgroundImage ?? false,
            onUploadContent: onUploadImage,
            onRemoveContent: onRemoveImage,
            onUploadBackground: onUploadBackgroundImage,
            onRemoveBackground: onRemoveBackgroundImage,
          }}
        />
      )
    case 'services':
      return (
        <ServicesHeadingEditor
          content={section.content}
          onChange={onChange}
          services={services}
          officePhone={officePhone}
          socialWhatsapp={socialWhatsapp}
          bookingFilter={bookingFilter ?? true}
        />
      )
    case 'bookingServices':
      return (
        <ServicesHeadingEditor
          content={section.content}
          onChange={onChange}
          services={services}
          officePhone={officePhone}
          socialWhatsapp={socialWhatsapp}
          bookingFilter={bookingFilter ?? false}
        />
      )
    case 'features':
      return (
        <FeaturesEditor
          content={section.content}
          onChange={onChange}
          sectionMedia={{
            content: section.content,
            onChange,
            contentImageUrl: imageUrl,
            backgroundImageUrl: backgroundImageUrl ?? null,
            uploadingContent: uploadingImage,
            uploadingBackground: uploadingBackgroundImage ?? false,
            onUploadContent: onUploadImage,
            onRemoveContent: onRemoveImage,
            onUploadBackground: onUploadBackgroundImage,
            onRemoveBackground: onRemoveBackgroundImage,
          }}
        />
      )
    case 'process':
      return (
        <ProcessEditor
          content={section.content}
          onChange={onChange}
          sectionMedia={{
            content: section.content,
            onChange,
            contentImageUrl: imageUrl,
            backgroundImageUrl: backgroundImageUrl ?? null,
            uploadingContent: uploadingImage,
            uploadingBackground: uploadingBackgroundImage ?? false,
            onUploadContent: onUploadImage,
            onRemoveContent: onRemoveImage,
            onUploadBackground: onUploadBackgroundImage,
            onRemoveBackground: onRemoveBackgroundImage,
          }}
        />
      )
    case 'faq':
      return (
        <FaqEditor
          content={section.content}
          onChange={onChange}
          sectionMedia={{
            content: section.content,
            onChange,
            contentImageUrl: imageUrl,
            backgroundImageUrl: backgroundImageUrl ?? null,
            uploadingContent: uploadingImage,
            uploadingBackground: uploadingBackgroundImage ?? false,
            onUploadContent: onUploadImage,
            onRemoveContent: onRemoveImage,
            onUploadBackground: onUploadBackgroundImage,
            onRemoveBackground: onRemoveBackgroundImage,
          }}
        />
      )
    case 'contact':
      return (
        <ContactEditor
          content={section.content}
          onChange={onChange}
          services={services}
          officePhone={officePhone}
          socialWhatsapp={socialWhatsapp}
          sectionMedia={{
            content: section.content,
            onChange,
            contentImageUrl: imageUrl,
            backgroundImageUrl: backgroundImageUrl ?? null,
            uploadingContent: uploadingImage,
            uploadingBackground: uploadingBackgroundImage ?? false,
            onUploadContent: onUploadImage,
            onRemoveContent: onRemoveImage,
            onUploadBackground: onUploadBackgroundImage,
            onRemoveBackground: onRemoveBackgroundImage,
          }}
        />
      )
    case 'header':
      return (
        <ChromeSectionEditor
          content={section.content}
          onChange={onChange}
          title="Barra do topo"
          showTitleField
          showLogoControl
          showNavControls
          services={services}
          titleFieldLabel="Texto curto na barra (opcional)"
          titlePlaceholder="Deixe vazio → usa o Nome na barra do topo"
          titleHint="Quase nunca precisa alterar. O nome principal define-se acima em «Nome na barra do topo». Os links da barra (texto e destino) editam-se abaixo. O título grande edita-se em «2. Destaque principal»."
        />
      )
    case 'footer':
      return (
        <ChromeSectionEditor
          content={section.content}
          onChange={onChange}
          title="Rodapé"
          showFooterContactFields
          officeContact={officeContact}
        />
      )
    default:
      return null
  }
}

function isValidHex(value: string) {
  return HEX_RE.test(value.trim())
}

/** Extrai o handle a partir de um URL conhecido (ex.: instagram.com/nome → nome). */
function stripSocialPrefix(url: string | null | undefined, prefixes: string[]): string {
  const raw = String(url || '').trim()
  if (!raw) return ''
  for (const prefix of prefixes) {
    if (raw.toLowerCase().startsWith(prefix.toLowerCase())) {
      return raw.slice(prefix.length).replace(/^\/+/, '').replace(/\/$/, '')
    }
  }
  if (/^https?:\/\//i.test(raw)) return raw
  return raw.replace(/^@/, '')
}

function whatsappDisplayNumber(url: string | null | undefined): string {
  const raw = String(url || '').trim()
  if (!raw) return ''
  const fromWa = raw.match(/wa\.me\/(\d+)/i)
  if (fromWa) return fromWa[1]
  return raw.replace(/\D/g, '')
}

function PageThemeColors({
  draft,
  onChange,
  embedded = false,
}: {
  draft: PublicSiteConfig
  onChange: (next: PublicSiteConfig) => void
  embedded?: boolean
}) {
  const theme = draft.theme
  const bg = theme.backgroundColor || ''
  const surface = theme.surfaceColor || ''
  const bgInvalid = bg.trim() !== '' && !isValidHex(bg)
  const surfaceInvalid = surface.trim() !== '' && !isValidHex(surface)

  const setPageBackground = (value: string | null) => {
    const prev = parsePublicSiteHex(draft.theme.backgroundColor)
    const nextParsed = parsePublicSiteHex(value)
    const hadSectionBgs = draft.sections.some((s) => {
      const c = s.content as { backgroundColor?: string | null }
      return Boolean(c?.backgroundColor)
    })
    const next = applyPageBackgroundColor(draft, value)
    onChange(next)
    if (hadSectionBgs && nextParsed && nextParsed !== prev) {
      toast.message('Fundos das secções limpos', {
        description: 'Assim a cor da página aparece no preview. Pode voltar a colorir cada bloco nas secções.',
      })
    }
  }

  const grid = (
      <div className={embedded ? 'grid gap-3 sm:grid-cols-2' : 'mt-2 grid gap-3 sm:grid-cols-2'}>
        <div className="space-y-1">
          <Label htmlFor="ps-page-bg" className="text-[11px]">
            Página
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Fundo da página"
              value={isValidHex(bg) ? bg : '#faf9f7'}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPageBackground(e.target.value)}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
            />
            <Input
              id="ps-page-bg"
              value={bg}
              onChange={(e: FormChangeEvent) => setPageBackground(e.target.value.trim() || null)}
              placeholder="#faf9f7"
              className={bgInvalid ? 'h-9 border-destructive' : 'h-9'}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ps-surface" className="text-[11px]">
            Cartões
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Fundo dos cartões"
              value={isValidHex(surface) ? surface : '#ffffff'}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange({
                  ...draft,
                  theme: { ...draft.theme, surfaceColor: parsePublicSiteHex(e.target.value) },
                })
              }
              className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
            />
            <Input
              id="ps-surface"
              value={surface}
              onChange={(e: FormChangeEvent) =>
                onChange({
                  ...draft,
                  theme: { ...draft.theme, surfaceColor: parsePublicSiteHex(e.target.value) },
                })
              }
              placeholder="#ffffff"
              className={surfaceInvalid ? 'h-9 border-destructive' : 'h-9'}
            />
          </div>
        </div>
      </div>
  )

  const sectionHint = (
    <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
      Mudar a cor da página limpa fundos dos blocos para o preview actualizar.
    </p>
  )

  if (embedded) {
    return (
      <>
        {grid}
        {sectionHint}
      </>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <p className="text-xs font-semibold text-foreground">Fundo da página</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Esta cor pinta a página inteira no preview. Se um bloco tiver cor própria, essa cor sobrepõe-se — ao mudar
        aqui, limpamos os fundos dos blocos para a alteração se ver de imediato.
      </p>
      {grid}
    </div>
  )
}

function ThemeEditor({
  draft,
  onChange,
  embedded = false,
}: {
  draft: PublicSiteConfig
  onChange: (next: PublicSiteConfig) => void
  embedded?: boolean
}) {
  const setSocial = (key: keyof PublicSiteConfig['socialLinks'], value: string | null) => {
    onChange({ ...draft, socialLinks: { ...draft.socialLinks, [key]: value } })
  }

  const fields = (
        <div className={embedded ? 'space-y-4' : 'mt-4 space-y-4'}>
          <SocialHandleField
            label="Instagram"
            icon={Instagram}
            prefix="https://instagram.com/"
            value={stripSocialPrefix(draft.socialLinks.instagram, [
              'https://instagram.com/',
              'https://www.instagram.com/',
              'http://instagram.com/',
            ])}
            onChange={(handle) =>
              setSocial('instagram', handle ? `https://instagram.com/${handle.replace(/^@/, '')}` : null)
            }
            placeholder="nome_do_escritorio"
          />
          <SocialHandleField
            label="Facebook"
            icon={Facebook}
            prefix="https://facebook.com/"
            value={stripSocialPrefix(draft.socialLinks.facebook, [
              'https://facebook.com/',
              'https://www.facebook.com/',
              'http://facebook.com/',
            ])}
            onChange={(handle) =>
              setSocial('facebook', handle ? `https://facebook.com/${handle.replace(/^@/, '')}` : null)
            }
            placeholder="pagina-do-escritorio"
          />
          <SocialHandleField
            label="LinkedIn"
            icon={Linkedin}
            prefix="https://linkedin.com/company/"
            value={stripSocialPrefix(draft.socialLinks.linkedin, [
              'https://linkedin.com/company/',
              'https://www.linkedin.com/company/',
              'https://linkedin.com/in/',
              'https://www.linkedin.com/in/',
            ])}
            onChange={(handle) =>
              setSocial('linkedin', handle ? `https://linkedin.com/company/${handle.replace(/^@/, '')}` : null)
            }
            placeholder="nome-da-empresa"
          />
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </Label>
            <div className="flex items-center gap-0 overflow-hidden rounded-md border border-input">
              <span className="shrink-0 bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">wa.me/</span>
              <Input
                value={whatsappDisplayNumber(draft.socialLinks.whatsapp)}
                onChange={(e: FormChangeEvent) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 15)
                  setSocial('whatsapp', digits ? `https://wa.me/${digits}` : null)
                }}
                placeholder="351912345678"
                className="border-0 focus-visible:ring-0"
                inputMode="tel"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Inclua o indicativo do país (ex.: 351 para Portugal) + número, sem espaços.
            </p>
          </div>
          <SocialHandleField
            label="Outro site"
            icon={Globe}
            prefix="https://"
            value={stripSocialPrefix(draft.socialLinks.website, ['https://', 'http://'])}
            onChange={(handle) => setSocial('website', handle ? `https://${handle}` : null)}
            placeholder="www.meuescritorio.pt"
          />
        </div>
  )

  if (embedded) {
    return (
      <>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          O início do link já está preenchido — escreva só o utilizador (ou o número no WhatsApp).
        </p>
        {fields}
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 p-4">
        <Label className="text-sm font-semibold">Redes sociais</Label>
        <p className="mt-1 text-caption text-muted-foreground">
          O início do link já está preenchido — escreva só o seu nome de utilizador (ou o número no WhatsApp).
        </p>
        {fields}
      </div>
    </div>
  )
}

function SocialHandleField({
  label,
  icon: Icon,
  prefix,
  value,
  onChange,
  placeholder,
}: {
  label: string
  icon: LucideIcon
  prefix: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-xs">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <div className="flex items-center gap-0 overflow-hidden rounded-md border border-input">
        <span className="max-w-[55%] shrink-0 truncate bg-muted/50 px-2.5 py-2 text-[11px] text-muted-foreground">
          {prefix}
        </span>
        <Input
          value={value}
          onChange={(e: FormChangeEvent) => onChange(e.target.value.trim())}
          placeholder={placeholder}
          className="border-0 focus-visible:ring-0"
        />
      </div>
    </div>
  )
}
