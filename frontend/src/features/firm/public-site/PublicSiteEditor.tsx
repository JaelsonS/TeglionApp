import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, ExternalLink, Eye, Facebook, Globe, Instagram, Linkedin, Loader2, MessageCircle, Save, Upload } from 'lucide-react'
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
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { firmPublicSiteApi } from '@/infrastructure/api/contabil/firmPublicSite'
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
  ContactEditor,
  FaqEditor,
  FeaturesEditor,
  HeroEditor,
  ProcessEditor,
  ServicesHeadingEditor,
} from './sectionEditors'

const SECTION_LABELS: Record<PublicSiteSection['type'], string> = {
  header: 'Cabeçalho',
  hero: 'Destaque (Hero)',
  about: 'Sobre o escritório',
  services: 'Consultorias com agendamento',
  bookingServices: 'Outros serviços',
  features: 'Diferenciais',
  process: 'Como funciona',
  faq: 'Perguntas frequentes',
  contact: 'Contactos',
  footer: 'Rodapé',
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HEX_RE = /^#[0-9a-f]{6}$/i

type Props = {
  bundle: FirmSettingsBundle
}

export function PublicSiteEditor({ bundle }: Props) {
  const firmSlug = bundle.firm.slug || ''
  const [draft, setDraft] = useState<PublicSiteConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false)

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
      setDraft(siteQuery.data.draft)
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

  /** Troca a `order` com o vizinho na direcção pedida — reordena dentro da
   * lista completa (não só as secções activas), para uma secção desligada
   * já ficar na posição certa se for religada mais tarde. */
  const moveSection = (key: string, direction: 'up' | 'down') => {
    if (!draft) return
    const sorted = [...draft.sections].sort((a, b) => a.order - b.order)
    const index = sorted.findIndex((s) => s.key === key)
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) return
    const current = sorted[index]
    const neighbor = sorted[targetIndex]
    setDraft({
      ...draft,
      sections: draft.sections.map((s) => {
        if (s.key === current.key) return { ...s, order: neighbor.order }
        if (s.key === neighbor.key) return { ...s, order: current.order }
        return s
      }),
    })
  }

  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null)

  const uploadSectionImage = async (sectionKey: string, slot: 'hero' | 'institutional', file: File) => {
    setUploadingImageKey(sectionKey)
    try {
      const image = await firmPublicSiteApi.uploadImage(slot, file)
      setDraft((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          images: { ...prev.images, [slot]: [...prev.images[slot], image] },
          sections: prev.sections.map((s) =>
            s.key === sectionKey && 'imageIds' in s.content
              ? ({ ...s, content: { ...s.content, imageIds: [image.id] } } as PublicSiteSection)
              : s,
          ),
        }
      })
    } catch (err) {
      toast.error('Não foi possível enviar a imagem', { description: getErrorMessage(err) })
    } finally {
      setUploadingImageKey(null)
    }
  }

  const removeSectionImage = (sectionKey: string, slot: 'hero' | 'institutional') => {
    setDraft((prev) => {
      if (!prev) return prev
      const section = prev.sections.find((s) => s.key === sectionKey)
      const imageId = section && 'imageIds' in section.content ? section.content.imageIds[0] : undefined
      return {
        ...prev,
        images: { ...prev.images, [slot]: prev.images[slot].filter((img) => img.id !== imageId) },
        sections: prev.sections.map((s) =>
          s.key === sectionKey && 'imageIds' in s.content ? ({ ...s, content: { ...s.content, imageIds: [] } } as PublicSiteSection) : s,
        ),
      }
    })
  }

  function resolveSectionImageUrl(section: PublicSiteSection, slot: 'hero' | 'institutional'): string | null {
    if (!draft || !('imageIds' in section.content)) return null
    const id = section.content.imageIds[0]
    if (!id) return null
    return draft.images[slot].find((img) => img.id === id)?.url || null
  }

  const onSaveDraft = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const result = await firmPublicSiteApi.saveDraft(draft)
      setDraft(result.draft)
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
      // Guarda o rascunho actual primeiro — a pré-visualização tem de reflectir
      // o que está no ecrã, não a última vez que "Guardar rascunho" foi clicado.
      if (draft) await firmPublicSiteApi.saveDraft(draft)
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
      if (draft) await firmPublicSiteApi.saveDraft(draft)
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

  if (siteQuery.isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const previewServices: PublicFirmServiceSummary[] = servicesQuery.data?.items || []
  const booking = bookingQuery.data?.booking

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {siteQuery.data?.publishedAt ? `Publicado pela última vez em ${new Date(siteQuery.data.publishedAt).toLocaleString('pt-PT')}` : 'Ainda não publicado'}
          </p>
          {firmSlug ? (
            <a href={`/${encodeURIComponent(firmSlug)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              teglion.com/{firmSlug} <ExternalLink className="h-3 w-3" />
            </a>
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
          <Button type="button" className="cb-btn-primary" size="sm" disabled={publishing} onClick={() => setConfirmPublishOpen(true)}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Publicar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          {draft.sections
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((section, index, sorted) => (
              <div key={section.key} className="rounded-xl border border-border/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <Checkbox
                      checked={section.enabled}
                      onCheckedChange={(v: boolean | 'indeterminate') => toggleSection(section.key, v === true)}
                    />
                    {SECTION_LABELS[section.type]}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => moveSection(section.key, 'up')}
                      aria-label="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === sorted.length - 1}
                      onClick={() => moveSection(section.key, 'down')}
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {section.enabled ? (
                  <SectionEditorSwitch
                    section={section}
                    onChange={(content) => patchSectionContent(section.key, content)}
                    services={previewServices}
                    imageUrl={
                      section.type === 'hero'
                        ? resolveSectionImageUrl(section, 'hero')
                        : section.type === 'about'
                          ? resolveSectionImageUrl(section, 'institutional')
                          : null
                    }
                    uploadingImage={uploadingImageKey === section.key}
                    onUploadImage={(file: File) =>
                      void uploadSectionImage(section.key, section.type === 'about' ? 'institutional' : 'hero', file)
                    }
                    onRemoveImage={() => removeSectionImage(section.key, section.type === 'about' ? 'institutional' : 'hero')}
                  />
                ) : null}
              </div>
            ))}

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
            <div>
              <Label className="text-sm font-semibold">Termos, privacidade e reclamações</Label>
              <p className="mt-1 text-caption text-muted-foreground">
                Aplicam-se a toda a página pública (não por serviço). Os modelos são referência para adaptar —
                a Teglion não presta aconselhamento jurídico e não se responsabiliza pelo conteúdo.
              </p>
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
            <p className="text-caption text-muted-foreground">
              Modelo de referência para o escritório adaptar; a Teglion não presta aconselhamento jurídico e não se
              responsabiliza pelo conteúdo.
            </p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Livro de Reclamações (URL)</span>
              <Input
                placeholder="https://www.livroreclamacoes.pt/..."
                value={draft.complaintsBookUrl || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, complaintsBookUrl: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Livro de elogios (contacto opcional)</span>
              <Input
                placeholder="email ou telefone"
                value={draft.praiseContact || ''}
                onChange={(e: FormChangeEvent) => setDraft({ ...draft, praiseContact: e.target.value || null })}
              />
            </label>
          </div>
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
          <div
            className="max-h-[80vh] overflow-y-auto rounded-xl border border-border/50"
            style={resolveFirmBrandingCssVars({
              primaryColor: draft.theme.primaryColor,
              secondaryColor: draft.theme.secondaryColor,
            })}
          >
            <DefaultTemplate
              config={draft}
              ctx={{
                firmSlug,
                firmName: bundle.firm.name,
                logoUrl: bundle.logoUrl || null,
                services: previewServices,
                contact: bundle.contact,
                showPrices: draft.showPrices !== false,
                complaintsBookUrl: draft.complaintsBookUrl,
                praiseContact: draft.praiseContact,
              }}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={confirmPublishOpen} onOpenChange={setConfirmPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar página pública?</AlertDialogTitle>
            <AlertDialogDescription>
              A partir de agora, teglion.com/{firmSlug} passa a mostrar esta versão a qualquer visitante.
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
    </div>
  )
}

function SectionEditorSwitch({
  section,
  onChange,
  imageUrl,
  uploadingImage,
  onUploadImage,
  onRemoveImage,
  services,
}: {
  section: PublicSiteSection
  onChange: (content: PublicSiteSection['content']) => void
  imageUrl: string | null
  uploadingImage: boolean
  onUploadImage: (file: File) => void
  onRemoveImage: () => void
  services: PublicFirmServiceSummary[]
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
        />
      )
    case 'services':
      return <ServicesHeadingEditor content={section.content} onChange={onChange} placeholder="Consultorias com agendamento" />
    case 'bookingServices':
      return <ServicesHeadingEditor content={section.content} onChange={onChange} placeholder="Outros serviços" />
    case 'features':
      return <FeaturesEditor content={section.content} onChange={onChange} />
    case 'process':
      return <ProcessEditor content={section.content} onChange={onChange} />
    case 'faq':
      return <FaqEditor content={section.content} onChange={onChange} />
    case 'contact':
      return <ContactEditor content={section.content} onChange={onChange} />
    case 'header':
    case 'footer':
      return <p className="text-caption text-muted-foreground">Sem opções — usa o logótipo e as redes sociais já configurados.</p>
    default:
      return null
  }
}

function isValidHex(value: string) {
  return HEX_RE.test(value.trim())
}

function ThemeEditor({ draft, onChange }: { draft: PublicSiteConfig; onChange: (next: PublicSiteConfig) => void }) {
  const primary = draft.theme.primaryColor || ''
  const secondary = draft.theme.secondaryColor || ''
  const primaryInvalid = primary.trim() !== '' && !isValidHex(primary)
  const secondaryInvalid = secondary.trim() !== '' && !isValidHex(secondary)

  return (
    <div className="rounded-xl border border-border/50 p-4">
      <Label className="text-sm font-semibold">Cores</Label>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ps-primary">Cor principal</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Escolher cor principal"
              value={isValidHex(primary) ? primary : '#12352a'}
              onChange={(e) => onChange({ ...draft, theme: { ...draft.theme, primaryColor: e.target.value } })}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
            />
            <Input
              id="ps-primary"
              value={primary}
              onChange={(e: FormChangeEvent) => onChange({ ...draft, theme: { ...draft.theme, primaryColor: e.target.value } })}
              placeholder="#12352a"
              className={primaryInvalid ? 'border-destructive' : undefined}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ps-secondary">Cor secundária</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Escolher cor secundária"
              value={isValidHex(secondary) ? secondary : '#c9a24b'}
              onChange={(e) => onChange({ ...draft, theme: { ...draft.theme, secondaryColor: e.target.value } })}
              className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
            />
            <Input
              id="ps-secondary"
              value={secondary}
              onChange={(e: FormChangeEvent) => onChange({ ...draft, theme: { ...draft.theme, secondaryColor: e.target.value } })}
              placeholder="#c9a24b"
              className={secondaryInvalid ? 'border-destructive' : undefined}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SocialLinkField
          label="Instagram"
          icon={Instagram}
          value={draft.socialLinks.instagram || ''}
          onChange={(v) => onChange({ ...draft, socialLinks: { ...draft.socialLinks, instagram: v || null } })}
        />
        <SocialLinkField
          label="Facebook"
          icon={Facebook}
          value={draft.socialLinks.facebook || ''}
          onChange={(v) => onChange({ ...draft, socialLinks: { ...draft.socialLinks, facebook: v || null } })}
        />
        <SocialLinkField
          label="LinkedIn"
          icon={Linkedin}
          value={draft.socialLinks.linkedin || ''}
          onChange={(v) => onChange({ ...draft, socialLinks: { ...draft.socialLinks, linkedin: v || null } })}
        />
        <SocialLinkField
          label="WhatsApp"
          icon={MessageCircle}
          value={draft.socialLinks.whatsapp || ''}
          onChange={(v) => onChange({ ...draft, socialLinks: { ...draft.socialLinks, whatsapp: v || null } })}
          placeholder="https://wa.me/351…"
        />
        <SocialLinkField
          label="Outro site"
          icon={Globe}
          value={draft.socialLinks.website || ''}
          onChange={(v) => onChange({ ...draft, socialLinks: { ...draft.socialLinks, website: v || null } })}
        />
      </div>
    </div>
  )
}

function SocialLinkField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  label: string
  icon: LucideIcon
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-xs">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <Input value={value} onChange={(e: FormChangeEvent) => onChange(e.target.value)} placeholder={placeholder || 'https://…'} />
    </div>
  )
}
