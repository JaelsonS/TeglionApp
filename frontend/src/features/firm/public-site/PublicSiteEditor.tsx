import { useEffect, useState, type ChangeEvent, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ExternalLink,
  Eye,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  Maximize2,
  MessageCircle,
  Plus,
  Save,
  Trash2,
  Upload,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
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
  DEFAULT_PRIVACY_TEMPLATE,
  DEFAULT_TERMS_TEMPLATE,
} from '@/features/firm/public-site/publicSiteLegalTemplates'
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

const SECTION_LABELS: Record<PublicSiteSection['type'], string> = {
  header: 'Barra do topo',
  hero: 'Destaque principal',
  about: 'Sobre o escritório',
  services: 'Consultorias com agendamento',
  bookingServices: 'Outros serviços',
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
  services:
    'Título opcional · cartões em destaque · subtítulo da grelha · ordem do catálogo (consultorias com agendamento)',
  bookingServices:
    'Título opcional · cartões em destaque · subtítulo da grelha · ordem do catálogo (serviços sob pedido)',
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
  /** Por secção (key). Ausente = aberto por defeito em header/hero. */
  const [sectionOpenState, setSectionOpenState] = useState<Record<string, boolean>>({})
  const [previewExpanded, setPreviewExpanded] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<PublicSiteEditorPreviewDevice>('tablet')

  const isSectionEditorOpen = (section: PublicSiteSection) => {
    if (Object.prototype.hasOwnProperty.call(sectionOpenState, section.key)) {
      return sectionOpenState[section.key]
    }
    return section.type === 'hero'
  }

  const collapseAllSections = () => {
    const next: Record<string, boolean> = {}
    for (const s of draft?.sections || []) next[s.key] = false
    setSectionOpenState(next)
  }

  const toggleSectionOpen = (section: PublicSiteSection) => {
    setSectionOpenState((prev) => {
      const currently = Object.prototype.hasOwnProperty.call(prev, section.key)
        ? prev[section.key]
        : section.type === 'hero'
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
      await firmPublicSiteApi.publish()
      toast.success('Página pública publicada.')
      setConfirmPublishOpen(false)
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

  const previewPanel = (
    <DefaultTemplate
      config={draft}
      ctx={{
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
        showTeglionCredit: true,
        useEditorHeroFrame: true,
      }}
    />
  )

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

  return (
    <div className="cb-public-site-editor-root space-y-6">
      {/* Passo 1 — Identidade + publicar */}
      <section className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1 · Identidade</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">
            {siteQuery.data?.publishedAt
              ? `Publicado pela última vez em ${new Date(siteQuery.data.publishedAt).toLocaleString('pt-PT')}`
              : 'Ainda não publicado'}
          </p>
          {canEditLink ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[12rem] flex-1 space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Link público</span>
                <div className="flex items-center gap-1">
                  <span className="shrink-0 text-muted-foreground">teglion.com/</span>
                  <Input
                    className="h-9 font-mono text-sm"
                    value={slugDraft}
                    onChange={(e: FormChangeEvent) =>
                      setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                    }
                    placeholder="o-seu-escritorio"
                    maxLength={60}
                  />
                </div>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={savingSlug || !slugDraft.trim() || slugDraft.trim() === firmSlug}
                onClick={() => void onSaveSlug()}
              >
                {savingSlug ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Guardar link
              </Button>
              {firmSlug ? (
                <a
                  href={`/${encodeURIComponent(firmSlug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-border/60 px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Abrir <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ) : firmSlug ? (
            <a
              href={`/${encodeURIComponent(firmSlug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              teglion.com/{firmSlug} <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
          {canEditLink ? (
            <div className="flex flex-wrap items-end gap-2 pt-1">
              <label className="min-w-[14rem] flex-1 space-y-1 text-xs">
                <span className="font-medium text-muted-foreground">Nome na barra do topo</span>
                <Input
                  className="h-9 text-sm"
                  value={publicDisplayName}
                  onChange={(e: FormChangeEvent) => setPublicDisplayName(e.target.value)}
                  placeholder={bundle.firm.name || 'Como aparece na barra'}
                  maxLength={120}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={savingDisplayName}
                onClick={() => void onSavePublicDisplayName()}
              >
                {savingDisplayName ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Guardar nome
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={saving || publishing} onClick={() => void onSaveDraft()}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Guardar rascunho
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={previewing || !firmSlug} onClick={() => void onPreview()}>
            {previewing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
            Pré-visualizar
          </Button>
          <Button type="button" variant="primary" size="sm" disabled={publishing} loading={publishing} onClick={() => setConfirmPublishOpen(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Publicar
          </Button>
          {canEditLink ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={resetting}
              onClick={() => setConfirmResetOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Apagar e recomeçar
            </Button>
          ) : null}
        </div>
        </div>
      </section>

      <div className="cb-public-site-editor-grid">
        <div className="cb-public-site-editor-main order-1 min-w-0 space-y-4">
          <div className="space-y-3 rounded-xl border border-border/50 bg-card p-4 lg:hidden">
            <PublicSiteLogoCard
              draft={draft}
              firmLogoUrl={bundle.logoUrl ?? null}
              readOnly={!canEditLink}
              onDraftUpdate={setDraft}
              onLogoSourceChange={(zone, source) => void patchThemeLogoSource(zone, source)}
            />
            <PageThemeColors draft={draft} onChange={setDraft} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              2 · Secções do site
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={onAddSection}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar secção
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

          <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            3 · Complementos
          </p>
          <div className="rounded-xl border border-border/50 p-4">
            <Label className="text-sm font-semibold">Agendamento</Label>
            <p className="mt-1 text-caption text-muted-foreground">
              {booking
                ? `${booking.weekdays.map((d) => WEEKDAY_LABELS[d]).join(', ')} · ${booking.dayStart}–${booking.dayEnd} · slots de ${booking.slotMinutes} min`
                : 'A carregar…'}
            </p>
            <a href="/app/firm/agenda?panel=settings" className="mt-2 inline-block text-caption text-primary hover:underline">
              Editar disponibilidade →
            </a>
          </div>

          <ThemeEditor draft={draft} onChange={setDraft} />

          <div className="rounded-xl border border-border/50 p-4">
            <Label className="text-sm font-semibold">Preços na página pública</Label>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-border"
                checked={draft.showPrices !== false}
                onChange={(e) => setDraft({ ...draft, showPrices: e.target.checked })}
              />
              <span>
                Mostrar preços dos serviços
                <span className="mt-0.5 block text-caption text-muted-foreground">
                  Quando desligado, os cartões e a página do serviço omitem o valor.
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-xl border border-border/50 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-sm font-semibold">Termos, privacidade e reclamações</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft({
                    ...draft,
                    termsText: DEFAULT_TERMS_TEMPLATE,
                    privacyText: DEFAULT_PRIVACY_TEMPLATE,
                  })
                }
              >
                Usar modelo padrão
              </Button>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Termos de Utilização</span>
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={draft.termsText || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, termsText: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Política de Privacidade</span>
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={draft.privacyText || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, privacyText: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Livro de Reclamações — link</span>
              <Input
                placeholder="https://www.livroreclamacoes.pt/Pedido/Iniciar"
                value={draft.complaintsBookUrl || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, complaintsBookUrl: e.target.value || null })}
              />
              <button
                type="button"
                className="text-caption font-medium text-brand hover:underline"
                onClick={() =>
                  setDraft({
                    ...draft,
                    complaintsBookUrl: 'https://www.livroreclamacoes.pt/Pedido/Iniciar',
                    complaintsBookLabel: draft.complaintsBookLabel || 'Livro de Reclamações',
                  })
                }
              >
                Usar modelo oficial (livroreclamacoes.pt)
              </button>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Livro de Reclamações — texto do link</span>
              <Input
                placeholder="Livro de Reclamações"
                value={draft.complaintsBookLabel || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, complaintsBookLabel: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Elogios / avaliações — link</span>
              <Input
                placeholder="https://g.page/r/... (Google Reviews) ou outro URL"
                value={draft.praiseUrl || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, praiseUrl: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Elogios / avaliações — texto do link</span>
              <Input
                placeholder="Deixe a sua avaliação no Google"
                value={draft.praiseLabel || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, praiseLabel: e.target.value || null })}
              />
            </label>
          </div>

          <div className="hidden space-y-3 rounded-xl border border-border/50 bg-muted/15 p-4 lg:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Visual rápido
            </p>
            <PublicSiteLogoCard
              draft={draft}
              firmLogoUrl={bundle.logoUrl ?? null}
              readOnly={!canEditLink}
              onDraftUpdate={setDraft}
              onLogoSourceChange={(zone, source) => void patchThemeLogoSource(zone, source)}
            />
            <PageThemeColors draft={draft} onChange={setDraft} />
          </div>
        </div>

        <aside className="cb-public-site-editor-aside order-2 min-w-0">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pré-visualização ao vivo
              </p>
              <p className="text-[11px] text-muted-foreground">
                Escolha telemóvel ou tablet para ver o menu hamburger. Desktop mostra a barra horizontal (ecrãs largos).
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
                onClick={() => setPreviewExpanded(true)}
              >
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                Expandir
              </Button>
            </div>
          </div>
          <div
            key={`preview-bg-${draft.theme.backgroundColor || 'default'}-${draft.theme.surfaceColor || 'surface'}-${previewDevice}`}
            className="cb-public-site-editor-preview-scroll rounded-xl border border-border/50 shadow-sm"
            style={previewSurfaceStyle}
          >
            <PublicSiteEditorPreviewFrame canvasWidthPx={publicSiteEditorPreviewCanvasPx(previewDevice)}>
              {previewPanel}
            </PublicSiteEditorPreviewFrame>
          </div>
        </aside>
      </div>

      <Dialog open={previewExpanded} onOpenChange={setPreviewExpanded}>
        <DialogContent className="flex h-[min(92dvh,900px)] max-w-5xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3 text-left">
            <DialogTitle className="text-base">Pré-visualização — site público</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain" style={previewSurfaceStyle}>
            <PublicSiteEditorPreviewFrame expanded canvasWidthPx={publicSiteEditorPreviewCanvasPx(previewDevice)}>
              {previewPanel}
            </PublicSiteEditorPreviewFrame>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmPublishOpen} onOpenChange={setConfirmPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar página pública?</AlertDialogTitle>
            <AlertDialogDescription>
              A partir de agora, teglion.com/{firmSlug} passa a mostrar esta versão a qualquer visitante.
              Confirme só depois de ter guardado o que quer publicar (o botão Publicar também guarda o rascunho
              actual automaticamente). Ao partilhar o link no WhatsApp, a miniatura usa a imagem do destaque ou o
              logótipo do site público — não a imagem comercial do Teglion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={publishing} onClick={() => void onPublish()}>
              {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Publicar
            </AlertDialogAction>
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
}: {
  draft: PublicSiteConfig
  onChange: (next: PublicSiteConfig) => void
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

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <p className="text-xs font-semibold text-foreground">Fundo da página</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Esta cor pinta a página inteira no preview. Se um bloco tiver cor própria, essa cor sobrepõe-se — ao
        mudar aqui, limpamos os fundos dos blocos para a alteração se ver de imediato.
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
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
    </div>
  )
}

function ThemeEditor({ draft, onChange }: { draft: PublicSiteConfig; onChange: (next: PublicSiteConfig) => void }) {
  const setSocial = (key: keyof PublicSiteConfig['socialLinks'], value: string | null) => {
    onChange({ ...draft, socialLinks: { ...draft.socialLinks, [key]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 p-4">
        <Label className="text-sm font-semibold">Redes sociais</Label>
        <p className="mt-1 text-caption text-muted-foreground">
          O início do link já está preenchido — escreva só o seu nome de utilizador (ou o número no WhatsApp).
        </p>
        <div className="mt-4 space-y-4">
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
