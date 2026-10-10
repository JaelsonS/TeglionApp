import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, ImageIcon, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { PublicSiteHeroBanner } from '@/features/public-intake/PublicSiteHeroBanner'
import {
  heroEditorImagePosition,
  normalizeHeroImageFit,
  PUBLIC_SITE_HERO_EDITOR_FRAME_CLASS,
  type PublicSiteHeroImageFit,
  type PublicSiteHeroImageFocus,
} from '@/features/public-intake/heroBannerFit'
import {
  normalizeSectionImageFit,
  sectionBackgroundFramingFrameClass,
  sectionBackgroundImagePosition,
  sectionContentFramingFrameClass,
  sectionContentImagePosition,
} from '@/features/public-intake/publicSiteSectionMedia'
import { normalizeHeroBackgroundOverlay } from '@/features/public-intake/PublicSiteHeroSurface'
import { PublicSiteBrandColorsPanel } from './PublicSiteBrandColorsPanel'
import {
  heroContentAlignUiValue,
  patchHeroContentAlign,
  patchSectionContentAlign,
  sectionContentAlignUiValue,
  type PublicSiteContentAlign,
} from '@/features/public-intake/publicSiteContentAlign'
import {
  ImagePositionFrame,
  ImagePositionZoomSlider,
  type ImagePosition,
} from '@/shared/components/media/ImagePositionEditor'
import { servicePositionedImageStyle } from '@/shared/utils/servicePositionedImageStyle'
import { Button } from '@/shared/components/ui/button'
import { ImageCropDialog, type ImageCropAspect } from '@/shared/components/media/ImageCropDialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { firmPublicSiteApi } from '@/infrastructure/api/contabil/firmPublicSite'
import {
  resolvePublicSitePreviewZoneLogoUrl,
} from '@/features/firm/public-site/publicSitePreviewLogo'
import type {
  PublicSiteAboutContent,
  PublicSiteChromeContent,
  PublicSiteConfig,
  PublicSiteLogoSource,
  PublicSiteSectionMediaFields,
  PublicSiteContactContent,
  PublicSiteCta,
  PublicSiteFaqContent,
  PublicSiteFeaturesContent,
  PublicSiteHeroContent,
  PublicSiteNavLink,
  PublicSiteNavLinkKind,
  PublicSiteNavSectionId,
  PublicSiteProcessContent,
  PublicSiteServicesContent,
} from '@/shared/types/firmPublicSite'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'
import {
  defaultPublicSiteNavLinks,
  emptyPublicSiteNavLink,
  MAX_PUBLIC_SITE_NAV_LINKS,
  PUBLIC_SITE_SECTION_ANCHORS,
} from '@/features/public-intake/publicSiteNavLinks'
import { coerceExternalHttpsUrl, isPublicCtaRenderable } from '@/features/public-intake/publicSiteCtas'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingService } from '@/shared/types/contabil'
import { moveItemInArray } from './publicSiteSectionFactory'

const HEX_RE = /^#[0-9a-f]{6}$/i

function generateStableId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}${random}`
}

function isValidHex(value: string) {
  return HEX_RE.test(value.trim())
}

/** Seletor compacto ao lado de cada campo — vazio = cor padrão do tema. */
export function InlineColorField({
  id,
  label,
  value,
  fallback = '#12352a',
  onChange,
}: {
  id: string
  label: string
  value?: string | null
  fallback?: string
  onChange: (value: string | null) => void
}) {
  const raw = value || ''
  const invalid = raw.trim() !== '' && !isValidHex(raw)
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-caption text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          aria-label={label}
          value={isValidHex(raw) ? raw : fallback}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={raw}
          onChange={(e: FormChangeEvent) => onChange(e.target.value.trim() || null)}
          placeholder="Padrão"
          className={`h-8 font-mono text-xs ${invalid ? 'border-destructive' : ''}`}
        />
        {raw ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onChange(null)}>
            Limpar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

const CTA_TARGET_OPTIONS: { value: PublicSiteCta['target']['type']; label: string }[] = [
  { value: 'service-detail', label: 'Abrir serviço' },
  { value: 'phone', label: 'Ligar para o escritório' },
  { value: 'booking', label: 'Ver serviços' },
  { value: 'contact-form', label: 'Secção de contactos' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'external-url', label: 'Link externo' },
]

function emptyCtaTarget(
  type: PublicSiteCta['target']['type'],
  services: PublicFirmServiceSummary[],
  officePhone?: string | null,
): PublicSiteCta['target'] {
  if (type === 'external-url') return { type, url: '' }
  if (type === 'service-detail') return { type, serviceId: services[0]?.slug }
  if (type === 'phone') return { type, phone: officePhone || '' }
  if (type === 'whatsapp') return { type, phone: '' }
  return { type }
}

export function SectionCtasEditor({
  ctas,
  onChange,
  services,
  officePhone,
  socialWhatsapp,
}: {
  ctas: PublicSiteCta[]
  onChange: (ctas: PublicSiteCta[]) => void
  services: PublicFirmServiceSummary[]
  officePhone?: string | null
  socialWhatsapp?: string | null
}) {
  const addCta = () => {
    onChange([
      ...ctas,
      {
        id: generateStableId('cta_'),
        label: '',
        style: 'primary',
        backgroundColor: null,
        textColor: null,
        target: emptyCtaTarget(services[0]?.slug ? 'service-detail' : 'phone', services, officePhone),
      },
    ])
  }

  const patchCta = (id: string, patch: Partial<PublicSiteCta>) => {
    onChange(ctas.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-semibold">Botões</Label>
        {ctas.length < 3 ? (
          <Button type="button" variant="outline" size="sm" onClick={addCta}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar botão
          </Button>
        ) : null}
      </div>
      {ctas.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          Opcional. Ex.: «Agendar consultoria» (abre um serviço) ou «Ligar agora».
        </p>
      ) : null}
      {ctas.map((cta, index) => {
        const unpublished =
          cta.target.type === 'service-detail' &&
          Boolean(cta.target.serviceId) &&
          !services.some((s) => s.slug === cta.target.serviceId)
        return (
          <div key={cta.id} className="space-y-2 rounded-lg border border-border/50 bg-muted/5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <ReorderButtons
                  index={index}
                  total={ctas.length}
                  label={`botão ${index + 1}`}
                  onMove={(from, to) => onChange(moveItemInArray(ctas, from, to))}
                />
                <p className="text-caption font-medium text-muted-foreground">Botão {index + 1}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onChange(ctas.filter((c) => c.id !== cta.id))}
                aria-label="Remover botão"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-caption text-muted-foreground">Texto</Label>
                <Input
                  value={cta.label}
                  onChange={(e: FormChangeEvent) => patchCta(cta.id, { label: e.target.value })}
                  placeholder="Ex.: Agendar consultoria"
                  maxLength={80}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-caption text-muted-foreground">Ação</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={cta.target.type}
                  onChange={(e) =>
                    patchCta(cta.id, {
                      target: emptyCtaTarget(e.target.value as PublicSiteCta['target']['type'], services, officePhone),
                    })
                  }
                >
                  {CTA_TARGET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {cta.target.type === 'service-detail' ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-caption text-muted-foreground">Serviço</Label>
                  {services.length > 0 ? (
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={cta.target.serviceId || ''}
                      onChange={(e) =>
                        patchCta(cta.id, { target: { type: 'service-detail', serviceId: e.target.value } })
                      }
                    >
                      {services.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      Ainda não há serviços públicos. Publique um serviço para o ligar a este botão.
                    </p>
                  )}
                </div>
              ) : null}
              {cta.target.type === 'phone' ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-caption text-muted-foreground">Telefone</Label>
                  <Input
                    value={cta.target.phone || ''}
                    onChange={(e: FormChangeEvent) =>
                      patchCta(cta.id, { target: { type: 'phone', phone: e.target.value } })
                    }
                    placeholder={officePhone || '+351 …'}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Vazio = usa o telefone do escritório. No telemóvel abre a chamada.
                  </p>
                </div>
              ) : null}
              {cta.target.type === 'whatsapp' ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-caption text-muted-foreground">Número WhatsApp</Label>
                  <Input
                    value={cta.target.phone || ''}
                    onChange={(e: FormChangeEvent) =>
                      patchCta(cta.id, { target: { type: 'whatsapp', phone: e.target.value } })
                    }
                    placeholder="+351 9xx xxx xxx"
                    inputMode="tel"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Inclua o indicativo (ex.: 351…). Se ficar vazio, o botão usa o WhatsApp de Complementos →
                    Redes sociais.
                    {socialWhatsapp
                      ? ' Já existe um WhatsApp nas redes sociais — o botão aparece na pré-visualização.'
                      : ''}
                  </p>
                </div>
              ) : null}
              {cta.target.type === 'external-url' ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-caption text-muted-foreground">Ligação</Label>
                  <Input
                    value={cta.target.url || ''}
                    onChange={(e: FormChangeEvent) =>
                      patchCta(cta.id, { target: { type: 'external-url', url: e.target.value } })
                    }
                    placeholder="https://exemplo.pt ou exemplo.pt"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Abre noutro separador. Pode escrever só o domínio — o Teglion guarda em https. Ligações
                    javascript: não aparecem na página.
                  </p>
                  {cta.target.url?.trim() && !coerceExternalHttpsUrl(cta.target.url) ? (
                    <p className="text-caption text-amber-800">
                      Este endereço não é válido ou não é seguro — o botão não aparece na pré-visualização nem
                      na página publicada.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            {unpublished ? (
              <p className="text-caption text-amber-800">
                Este serviço não está público — o botão não aparece na página até o publicar.
              </p>
            ) : null}
            {cta.target.type === 'whatsapp' &&
            !isPublicCtaRenderable(
              cta,
              { firmSlug: 'preview', services, contact: { phone: officePhone || null } },
              { whatsapp: socialWhatsapp || undefined },
            ) ? (
              <p className="text-caption text-amber-800">
                Indique o número neste botão ou preencha o WhatsApp em Complementos → Redes sociais. Sem um
                dos dois, o botão desaparece da pré-visualização.
              </p>
            ) : null}
            {cta.label.trim() ? (
              <p className="text-caption text-muted-foreground">
                Pré-visualização:{' '}
                <span
                  className="inline-flex items-center rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  style={
                    cta.backgroundColor || cta.textColor
                      ? { backgroundColor: cta.backgroundColor || undefined, color: cta.textColor || '#ffffff' }
                      : undefined
                  }
                >
                  {cta.label.trim()}
                </span>
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <InlineColorField
                id={`cta-bg-${cta.id}`}
                label="Cor do botão"
                value={cta.backgroundColor}
                fallback={cta.style === 'secondary' ? '#c9a24b' : '#12352a'}
                onChange={(v) => patchCta(cta.id, { backgroundColor: v })}
              />
              <InlineColorField
                id={`cta-text-${cta.id}`}
                label="Cor do texto do botão"
                value={cta.textColor}
                fallback="#ffffff"
                onChange={(v) => patchCta(cta.id, { textColor: v })}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Preencher / enquadrar — partilhado entre hero e imagens de secção. */
export function PublicSiteImageFramingBlock({
  imageUrl,
  imageFit,
  position,
  onFitChange,
  onPositionChange,
  fitRadioName,
  zoomMax = 3,
  showFitOptions = true,
  alwaysShowFitOptions = false,
  frameVariant = 'section',
  heroBackgroundColor,
  heroBackgroundOverlay,
  sectionMedia,
}: {
  imageUrl: string | null
  imageFit: 'cover' | 'contain'
  position: ImagePosition
  onFitChange: (fit: 'cover' | 'contain') => void
  onPositionChange: (next: ImagePosition) => void
  fitRadioName: string
  zoomMax?: number
  showFitOptions?: boolean
  /** Hero: escolher preencher/inteira antes de carregar foto. */
  alwaysShowFitOptions?: boolean
  /** hero = mesmo quadro do preview lateral; section = dimensões da secção publicada. */
  frameVariant?: 'hero' | 'section' | 'section-background'
  heroBackgroundColor?: string | null
  heroBackgroundOverlay?: number | null
  sectionMedia?: PublicSiteSectionMediaFields
}) {
  if (!imageUrl && !alwaysShowFitOptions) return null
  return (
    <div className="space-y-2">
      {showFitOptions ? (
      <fieldset className="space-y-2">
        <legend className="text-caption font-medium text-muted-foreground">Como a imagem preenche o espaço</legend>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 bg-background p-2.5 text-sm has-[:checked]:border-brand/40 has-[:checked]:bg-brand/[0.04]">
          <input
            type="radio"
            name={fitRadioName}
            className="mt-0.5"
            checked={imageFit === 'cover'}
            onChange={() => onFitChange('cover')}
          />
          <span>
            <span className="font-medium">Preencher (recomendado)</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Fotografias — preenche o espaço; arraste abaixo e use zoom para imagens pequenas.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 bg-background p-2.5 text-sm has-[:checked]:border-brand/40 has-[:checked]:bg-brand/[0.04]">
          <input
            type="radio"
            name={fitRadioName}
            className="mt-0.5"
            checked={imageFit === 'contain'}
            onChange={() => onFitChange('contain')}
          />
          <span>
            <span className="font-medium">Mostrar imagem inteira</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Logótipos ou artes — margens com a cor de fundo da secção.
            </span>
          </span>
        </label>
      </fieldset>
      ) : null}
      {imageUrl ? (
      <div className="space-y-2">
        <p className="text-caption font-medium text-muted-foreground">Enquadrar (arrastar)</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Clique ou arraste na foto para escolher a zona visível — igual aos serviços.
          {imageFit === 'cover'
            ? ' Aumente o zoom para preencher todo o espaço (pode cortar bordas).'
            : ' Arraste para centrar a imagem nas margens.'}
        </p>
        <div
          className={`relative overflow-hidden rounded-lg border border-border/60 ${
            frameVariant === 'hero'
              ? PUBLIC_SITE_HERO_EDITOR_FRAME_CLASS
              : frameVariant === 'section-background'
                ? sectionBackgroundFramingFrameClass()
                : sectionMedia
                  ? sectionContentFramingFrameClass(sectionMedia)
                  : 'min-h-[12rem] w-full'
          }`}
          style={
            frameVariant === 'hero' && heroBackgroundColor
              ? { backgroundColor: /^#[0-9a-f]{6}$/i.test(String(heroBackgroundColor)) ? String(heroBackgroundColor) : '#e8f0ec' }
              : undefined
          }
        >
          <ImagePositionFrame
            imageUrl={imageUrl}
            position={position}
            onChange={onPositionChange}
            objectFit={imageFit}
            className="h-full min-h-[inherit] w-full"
            showFocusMarker={frameVariant !== 'hero'}
          />
          {frameVariant === 'hero' ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundColor: `rgba(15, 23, 42, ${normalizeHeroBackgroundOverlay(heroBackgroundOverlay) / 100})`,
                }}
              />
              <p className="pointer-events-none absolute inset-x-0 bottom-3 z-10 px-3 text-center text-[11px] font-medium text-white/90 drop-shadow">
                Arraste na imagem — igual ao preview à direita
              </p>
            </>
          ) : null}
        </div>
        {imageFit === 'cover' ? (
          <ImagePositionZoomSlider
            zoom={position.zoom}
            max={zoomMax}
            label="Zoom (preencher)"
            onChange={(zoom) => onPositionChange({ ...position, zoom })}
          />
        ) : null}
      </div>
      ) : null}
    </div>
  )
}

/** Reaproveitado pelo Hero e pelo Sobre — um slot de imagem simples (v1: uma
 * foto por secção; o esquema já suporta várias, a UI não precisa disso já). */
export function ImagePickerField({
  label,
  imageUrl,
  uploading,
  onUpload,
  onRemove,
  cropAspect = 16 / 9,
  cropTitle = 'Recortar foto',
  skipCrop = false,
  previewFit,
  previewPosition,
  previewFocusX,
  previewFocusY,
  previewZoom,
  previewBackgroundColor,
  previewOverlay,
  previewVariant = 'hero',
  compactWhenFraming = false,
}: {
  label: string
  imageUrl: string | null
  uploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  cropAspect?: ImageCropAspect
  cropTitle?: string
  /** Hero: enviar o ficheiro original. Recorte opcional fica no enquadramento CSS. */
  skipCrop?: boolean
  previewFit?: PublicSiteHeroImageFit | null
  previewPosition?: PublicSiteHeroImageFocus | string | null
  previewFocusX?: number | null
  previewFocusY?: number | null
  previewZoom?: number | null
  previewBackgroundColor?: string | null
  previewOverlay?: number | null
  /** Hero: banner com overlay; secção: caixa 4:3 com enquadramento CSS. */
  previewVariant?: 'hero' | 'section'
  /** Com enquadramento abaixo: só botões substituir/remover (evita duas pré-visualizações). */
  compactWhenFraming?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            if (skipCrop) {
              onUpload(file)
            } else {
              setCropFile(file)
              setCropOpen(true)
            }
          }
          e.target.value = ''
        }}
      />
      {imageUrl && compactWhenFraming ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            Substituir foto
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            Remover
          </Button>
        </div>
      ) : null}
      {imageUrl && !compactWhenFraming ? (
        <div className="relative w-full overflow-hidden rounded-lg border border-border/50">
          {skipCrop ? (
            previewVariant === 'section' ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
                <img
                  src={imageUrl}
                  alt=""
                  draggable={false}
                  className="h-full w-full select-none"
                  style={servicePositionedImageStyle({
                    imageFocusX: previewFocusX,
                    imageFocusY: previewFocusY,
                    imageZoom: previewZoom,
                    imageFit: previewFit === 'contain' ? 'contain' : 'cover',
                  })}
                />
              </div>
            ) : (
              <PublicSiteHeroBanner
                src={imageUrl}
                alt=""
                fit={previewFit}
                position={previewPosition}
                imageFocusX={previewFocusX}
                imageFocusY={previewFocusY}
                imageZoom={previewZoom}
                backgroundColor={previewBackgroundColor}
                backgroundOverlay={previewOverlay}
              />
            )
          ) : (
            <img src={imageUrl} alt="" className="h-32 w-full object-cover" />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-1.5 top-1.5 h-6 w-6"
            onClick={onRemove}
            aria-label="Remover imagem"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : !imageUrl ? (
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="mr-1.5 h-3.5 w-3.5" />}
          Adicionar foto
        </Button>
      ) : null}
      {imageUrl && skipCrop && !compactWhenFraming ? (
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          Substituir foto
        </Button>
      ) : null}
      <ImageCropDialog
        open={cropOpen}
        onOpenChange={(next) => {
          setCropOpen(next)
          if (!next) setCropFile(null)
        }}
        file={cropFile}
        title={cropTitle}
        aspect={cropAspect}
        onCropped={(cropped) => onUpload(cropped)}
      />
    </div>
  )
}

type ContentWithAlign = { contentAlign?: PublicSiteContentAlign | null }

/** Controlo visível no topo de cada card de secção (modelo, personalizada, cabeçalho, rodapé). */
export function PublicSiteSectionAlignField<T extends ContentWithAlign>({
  content,
  onChange,
  variant = 'section',
}: {
  content: T
  onChange: (next: T) => void
  variant?: 'section' | 'hero' | 'chrome'
}) {
  const uiValue =
    variant === 'hero' ? heroContentAlignUiValue(content) : sectionContentAlignUiValue(content as PublicSiteSectionMediaFields)
  return (
    <div className="space-y-1.5 rounded-lg border border-brand/35 bg-brand/[0.05] p-3">
      <p className="text-sm font-semibold text-foreground">Alinhamento do conteúdo</p>
      <Label className="sr-only" htmlFor={`content-align-${variant}`}>
        Alinhamento do texto e botões
      </Label>
      <select
        id={`content-align-${variant}`}
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        value={uiValue}
        onChange={(e) => {
          const next = e.target.value as PublicSiteContentAlign
          onChange(
            (variant === 'hero'
              ? { ...content, ...patchHeroContentAlign(content, next) }
              : {
                  ...content,
                  ...patchSectionContentAlign(content as PublicSiteSectionMediaFields, next),
                }) as T,
          )
        }}
      >
        <option value="left">Esquerda</option>
        <option value="center">Centro</option>
        <option value="right">Direita</option>
      </select>
      <p className="text-[11px] text-muted-foreground">
        {variant === 'hero'
          ? 'Afecta título, frase, parágrafo e botões no destaque. Por omissão fica ao centro.'
          : variant === 'chrome'
            ? 'Barra do topo: marca e título. Rodapé: contactos e texto. Links e menu mantêm-se funcionais.'
            : 'Afecta títulos, texto e botões desta secção. A grelha de serviços mantém a largura total.'}
      </p>
    </div>
  )
}

type SectionMediaEditorProps<T extends PublicSiteSectionMediaFields> = {
  content: T
  onChange: (next: T) => void
  contentImageUrl: string | null
  backgroundImageUrl: string | null
  uploadingContent: boolean
  uploadingBackground: boolean
  onUploadContent: (file: File) => void
  onRemoveContent: () => void
  onUploadBackground?: (file: File) => void
  onRemoveBackground?: () => void
  contentLabel?: string
}

export function SectionMediaEditor<T extends PublicSiteSectionMediaFields>({
  content,
  onChange,
  contentImageUrl,
  backgroundImageUrl,
  uploadingContent,
  uploadingBackground,
  onUploadContent,
  onRemoveContent,
  onUploadBackground,
  onRemoveBackground,
  contentLabel = 'Imagem desta secção',
}: SectionMediaEditorProps<T>) {
  const placement = content.imagePlacement === 'left' || content.imagePlacement === 'right' ? content.imagePlacement : 'above'
  const size = content.imageSize === 'sm' || content.imageSize === 'md' || content.imageSize === 'lg' ? content.imageSize : 'full'
  const contentFit = normalizeSectionImageFit(content.imageFit)
  const contentPosition = sectionContentImagePosition(content)
  const backgroundPosition = sectionBackgroundImagePosition(content)

  const applyContentPosition = (next: ImagePosition) => {
    onChange({
      ...content,
      imageFocusX: next.focusX,
      imageFocusY: next.focusY,
      imageZoom: next.zoom,
    })
  }

  const applyBackgroundPosition = (next: ImagePosition) => {
    onChange({
      ...content,
      backgroundImageFocusX: next.focusX,
      backgroundImageFocusY: next.focusY,
      backgroundImageZoom: next.zoom,
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/40 bg-muted/10 p-3">
      <p className="text-sm font-semibold">Imagens (só página pública)</p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={content.showImage !== false}
          onChange={(e) => onChange({ ...content, showImage: e.target.checked })}
        />
        Mostrar imagem de conteúdo
      </label>
      <ImagePickerField
        label={contentLabel}
        imageUrl={contentImageUrl}
        uploading={uploadingContent}
        onUpload={onUploadContent}
        onRemove={onRemoveContent}
        skipCrop
        compactWhenFraming={Boolean(contentImageUrl)}
        previewVariant="section"
        previewFit={contentFit}
        previewFocusX={content.imageFocusX}
        previewFocusY={content.imageFocusY}
        previewZoom={content.imageZoom}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-caption text-muted-foreground">Posição</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={placement}
            onChange={(e) =>
              onChange({
                ...content,
                imagePlacement: e.target.value as 'above' | 'left' | 'right',
              })
            }
          >
            <option value="above">Acima do texto</option>
            <option value="left">Esquerda do texto</option>
            <option value="right">Direita do texto</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-caption text-muted-foreground">Tamanho</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={size}
            onChange={(e) =>
              onChange({
                ...content,
                imageSize: e.target.value as 'sm' | 'md' | 'lg' | 'full',
              })
            }
          >
            <option value="sm">Pequeno</option>
            <option value="md">Médio</option>
            <option value="lg">Grande</option>
            <option value="full">Largura total</option>
          </select>
        </div>
      </div>
      {contentImageUrl ? (
        <PublicSiteImageFramingBlock
          imageUrl={contentImageUrl}
          imageFit={contentFit}
          position={contentPosition}
          fitRadioName={`section-content-fit-${contentLabel}`}
          frameVariant="section"
          sectionMedia={content}
          onFitChange={(imageFit) => onChange({ ...content, imageFit })}
          onPositionChange={applyContentPosition}
        />
      ) : null}
      {onUploadBackground && onRemoveBackground ? (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={content.showBackgroundImage === true}
              onChange={(e) => onChange({ ...content, showBackgroundImage: e.target.checked })}
            />
            Imagem de fundo (suave, por baixo do texto)
          </label>
          <ImagePickerField
            label="Fundo (opcional)"
            imageUrl={backgroundImageUrl}
            uploading={uploadingBackground}
            onUpload={onUploadBackground}
            onRemove={onRemoveBackground}
            skipCrop
            compactWhenFraming={Boolean(backgroundImageUrl)}
            previewVariant="section"
            previewFit="cover"
            previewFocusX={content.backgroundImageFocusX}
            previewFocusY={content.backgroundImageFocusY}
            previewZoom={content.backgroundImageZoom}
          />
          {backgroundImageUrl ? (
            <PublicSiteImageFramingBlock
              imageUrl={backgroundImageUrl}
              imageFit="cover"
              position={backgroundPosition}
              fitRadioName={`section-bg-fit-${contentLabel}`}
              frameVariant="section-background"
              showFitOptions={false}
              onFitChange={() => {}}
              onPositionChange={applyBackgroundPosition}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function ChromeSectionEditor({
  content,
  onChange,
  title,
  showTitleField = false,
  titleFieldLabel = 'Texto desta zona',
  titlePlaceholder,
  titleHint,
  showNavControls = false,
  showLogoControl = false,
  services = [],
  officeContact,
}: {
  content: PublicSiteChromeContent
  onChange: (next: PublicSiteChromeContent) => void
  title: string
  /** Cabeçalho: override opcional do nome público. */
  showTitleField?: boolean
  titleFieldLabel?: string
  titlePlaceholder?: string
  titleHint?: string
  /** Cabeçalho: texto e destino de cada link. */
  showNavControls?: boolean
  /** Cabeçalho: mostrar ou ocultar logótipo na barra. */
  showLogoControl?: boolean
  services?: PublicFirmServiceSummary[]
  officeContact?: { email?: string | null; phone?: string | null; address?: string | null }
}) {
  const navOn = content.showNav !== false
  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground">
        Cores só desta zona ({title}). Em branco = padrão da página.
      </p>
      {showTitleField ? (
        <div className="space-y-2">
          <Label htmlFor={`${title}-label`}>{titleFieldLabel}</Label>
          <Textarea
            id={`${title}-label`}
            value={content.title || ''}
            onChange={(e: FormChangeEvent) => onChange({ ...content, title: e.target.value })}
            placeholder={titlePlaceholder || 'Deixe vazio para usar o nome público'}
            maxLength={120}
            rows={2}
          />
          <p className="text-[11px] text-muted-foreground">
            {titleHint ||
              'Opcional. Se vazio, a barra do topo usa o «Nome na barra do topo» definido acima. Enter para nova linha.'}
          </p>
        </div>
      ) : null}
      {showLogoControl ? (
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 bg-background p-2.5 text-sm has-[:checked]:border-brand/40 has-[:checked]:bg-brand/[0.04]">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={content.showLogo !== false}
            onChange={(e) => onChange({ ...content, showLogo: e.target.checked })}
          />
          <span>
            <span className="font-medium">Mostrar logótipo na barra do topo</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              Depende do painel «Logótipos (só site público)» e desta opção.
            </span>
          </span>
        </label>
      ) : null}
      {showNavControls ? (
        <HeaderNavLinksEditor
          content={content}
          navOn={navOn}
          services={services}
          onChange={onChange}
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <InlineColorField
          id={`${title}-bg`}
          label="Cor de fundo da barra"
          value={content.backgroundColor}
          fallback="#f0f4f1"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
        <InlineColorField
          id={`${title}-text`}
          label="Cor do texto na barra"
          value={content.textColor}
          onChange={(v) => onChange({ ...content, textColor: v })}
        />
      </div>
    </div>
  )
}

const NAV_KIND_OPTIONS: { value: PublicSiteNavLinkKind; label: string }[] = [
  { value: 'section', label: 'Rolar nesta página' },
  { value: 'areas', label: 'Menu Áreas (catálogo)' },
  { value: 'service', label: 'Abrir um serviço' },
  { value: 'external', label: 'Página fora (https)' },
]

function emptyNavTarget(kind: PublicSiteNavLinkKind, services: PublicFirmServiceSummary[]): Partial<PublicSiteNavLink> {
  if (kind === 'section') return { kind, sectionId: 'servicos', url: undefined, serviceId: undefined }
  if (kind === 'areas') return { kind, sectionId: undefined, url: undefined, serviceId: undefined }
  if (kind === 'service') return { kind, sectionId: undefined, url: undefined, serviceId: services[0]?.slug }
  return { kind, sectionId: undefined, url: '', serviceId: undefined }
}

function HeaderNavLinksEditor({
  content,
  navOn,
  services,
  onChange,
}: {
  content: PublicSiteChromeContent
  navOn: boolean
  services: PublicFirmServiceSummary[]
  onChange: (next: PublicSiteChromeContent) => void
}) {
  const links = defaultPublicSiteNavLinks(content)

  const setLinks = (navLinks: PublicSiteNavLink[]) => {
    onChange({ ...content, navLinks })
  }

  const patchLink = (id: string, patch: Partial<PublicSiteNavLink>) => {
    setLinks(links.map((link) => (link.id === id ? { ...link, ...patch } : link)))
  }

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="text-sm font-medium text-foreground">Links na barra do topo</p>
      <p className="text-[11px] text-muted-foreground">
        Edite o texto que o visitante vê. Cada link pode rolar até uma secção desta página, abrir um
        serviço, abrir o menu Áreas, ou ir para um site https exterior.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={navOn}
          onCheckedChange={(v: boolean | 'indeterminate') =>
            onChange({ ...content, showNav: v === true, navLinks: links })
          }
        />
        Mostrar menu de navegação
      </label>
      <div className={navOn ? 'space-y-3' : 'pointer-events-none space-y-3 opacity-50'}>
        {links.map((link, index) => (
          <div key={link.id} className="space-y-2 rounded-lg border border-border/50 bg-background p-2.5">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={link.enabled}
                onCheckedChange={(v: boolean | 'indeterminate') =>
                  patchLink(link.id, { enabled: v === true })
                }
              />
              <Input
                value={link.label}
                onChange={(e: FormChangeEvent) => patchLink(link.id, { label: e.target.value })}
                placeholder="Texto do link"
                maxLength={40}
                className="h-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                aria-label="Remover link"
                onClick={() => setLinks(links.filter((item) => item.id !== link.id))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-caption text-muted-foreground">Quando clicar</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={link.kind}
                  onChange={(e) =>
                    patchLink(link.id, emptyNavTarget(e.target.value as PublicSiteNavLinkKind, services))
                  }
                >
                  {NAV_KIND_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {link.kind === 'section' ? (
                <div className="space-y-1">
                  <Label className="text-caption text-muted-foreground">Secção</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                    value={link.sectionId || 'servicos'}
                    onChange={(e) =>
                      patchLink(link.id, { sectionId: e.target.value as PublicSiteNavSectionId })
                    }
                  >
                    {PUBLIC_SITE_SECTION_ANCHORS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {link.kind === 'service' ? (
                <div className="space-y-1">
                  <Label className="text-caption text-muted-foreground">Serviço</Label>
                  {services.length > 0 ? (
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={link.serviceId || ''}
                      onChange={(e) => patchLink(link.id, { serviceId: e.target.value })}
                    >
                      {services.map((s) => (
                        <option key={s.slug} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Publique um serviço para o ligar a este link.
                    </p>
                  )}
                </div>
              ) : null}
              {link.kind === 'external' ? (
                <div className="space-y-1">
                  <Label className="text-caption text-muted-foreground">Endereço https</Label>
                  <Input
                    value={link.url || ''}
                    onChange={(e: FormChangeEvent) => patchLink(link.id, { url: e.target.value })}
                    placeholder="https://…"
                    maxLength={500}
                    className="h-9"
                  />
                </div>
              ) : null}
              {link.kind === 'areas' ? (
                <p className="self-end text-[11px] text-muted-foreground sm:col-span-1">
                  Abre o menu das categorias do catálogo público.
                </p>
              ) : null}
            </div>
            {links.length > 1 ? (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={index === 0}
                  onClick={() => {
                    const next = [...links]
                    const prev = next[index - 1]
                    next[index - 1] = link
                    next[index] = prev
                    setLinks(next)
                  }}
                >
                  Subir
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={index === links.length - 1}
                  onClick={() => {
                    const next = [...links]
                    const following = next[index + 1]
                    next[index + 1] = link
                    next[index] = following
                    setLinks(next)
                  }}
                >
                  Descer
                </Button>
              </div>
            ) : null}
          </div>
        ))}
        {links.length < MAX_PUBLIC_SITE_NAV_LINKS ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLinks([...links, emptyPublicSiteNavLink()])}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar link
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function HeroEditor({
  content,
  onChange,
  imageUrl,
  uploadingImage,
  onUploadImage,
  onRemoveImage,
  services,
  officePhone,
  publicDisplayName: _publicDisplayName,
  socialWhatsapp,
  siteDraft,
  onSiteDraftChange,
}: {
  content: PublicSiteHeroContent
  onChange: (next: PublicSiteHeroContent) => void
  imageUrl: string | null
  uploadingImage: boolean
  onUploadImage: (file: File) => void
  onRemoveImage: () => void
  services: PublicFirmServiceSummary[]
  officePhone?: string | null
  /** Nome do header — disponível para a Maya / callers; UI limpa sem parede de texto. */
  publicDisplayName?: string
  socialWhatsapp?: string | null
  siteDraft?: PublicSiteConfig
  onSiteDraftChange?: (next: PublicSiteConfig) => void
}) {
  const imageFit = normalizeHeroImageFit(content.imageFit)
  const overlay = normalizeHeroBackgroundOverlay(content.backgroundOverlay)
  const editorPosition = heroEditorImagePosition(content)

  const applyPosition = (next: { focusX: number; focusY: number; zoom: number }) => {
    onChange({
      ...content,
      imageFocusX: next.focusX,
      imageFocusY: next.focusY,
      imageZoom: next.zoom,
    })
  }

  return (
    <div className="space-y-5">
      {siteDraft && onSiteDraftChange ? (
        <PublicSiteBrandColorsPanel draft={siteDraft} onChange={onSiteDraftChange} variant="heroQuick" />
      ) : null}
      <div className="space-y-2 rounded-lg border border-brand/30 bg-brand/[0.04] p-3">
        <p className="text-sm font-semibold text-foreground">Imagem de fundo do destaque</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          A foto fica <span className="font-medium text-foreground">atrás</span> do título e da frase
          — não aparece como faixa gigante acima. O visitante lê o texto por cima da imagem.
        </p>
        <ImagePickerField
          label="Carregar imagem de fundo"
          imageUrl={imageUrl}
          uploading={uploadingImage}
          onUpload={onUploadImage}
          onRemove={onRemoveImage}
          skipCrop
          compactWhenFraming={Boolean(imageUrl)}
          previewFit={imageFit}
          previewPosition={content.imagePosition}
          previewFocusX={content.imageFocusX}
          previewFocusY={content.imageFocusY}
          previewZoom={content.imageZoom}
          previewBackgroundColor={content.backgroundColor}
          previewOverlay={overlay}
        />
        <PublicSiteImageFramingBlock
          imageUrl={imageUrl}
          imageFit={imageFit}
          position={editorPosition}
          fitRadioName="hero-image-fit"
          frameVariant="hero"
          heroBackgroundColor={content.backgroundColor}
          heroBackgroundOverlay={overlay}
          alwaysShowFitOptions
          onFitChange={(nextFit) => onChange({ ...content, imageFit: nextFit })}
          onPositionChange={applyPosition}
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="hero-overlay" className="text-caption text-muted-foreground">
              Escurecer fundo para ler o texto
            </Label>
            <span className="text-caption tabular-nums text-muted-foreground">{overlay}%</span>
          </div>
          <input
            id="hero-overlay"
            type="range"
            min={0}
            max={80}
            step={2}
            value={overlay}
            className="w-full accent-[hsl(var(--primary))]"
            onChange={(e) => onChange({ ...content, backgroundOverlay: Number(e.target.value) })}
          />
        </div>
        <InlineColorField
          id="hero-bg"
          label="Cor de fundo (sem foto ou margens)"
          value={content.backgroundColor}
          fallback="#e8f0ec"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
      </div>

      <div className="space-y-2 rounded-lg border border-brand/25 bg-brand/[0.03] p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor="hero-tagline" className="text-sm font-semibold">
            Frase curta acima do título
          </Label>
          <InlineColorField
            id="hero-tagline-color"
            label="Cor da frase curta"
            value={content.taglineColor}
            onChange={(v) => onChange({ ...content, taglineColor: v })}
          />
        </div>
        <Textarea
          id="hero-tagline"
          value={content.tagline}
          onChange={(e: FormChangeEvent) => onChange({ ...content, tagline: e.target.value })}
          placeholder="Ex.: A sua empresa em boas mãos"
          maxLength={160}
          rows={2}
        />
        <p className="text-[11px] text-muted-foreground">Enter para nova linha (até 3 linhas no site).</p>
      </div>

      <div className="space-y-2 rounded-lg border border-brand/25 bg-brand/[0.03] p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor="hero-title" className="text-sm font-semibold">
            Título principal (grande)
          </Label>
          <InlineColorField
            id="hero-title-color"
            label="Cor do título"
            value={content.titleColor}
            onChange={(v) => onChange({ ...content, titleColor: v })}
          />
        </div>
        <Textarea
          id="hero-title"
          value={content.title || ''}
          onChange={(e: FormChangeEvent) => onChange({ ...content, title: e.target.value })}
          placeholder="Ex.: Soluções de contabilidade e fiscalidade que fazem a diferença"
          maxLength={120}
          rows={3}
        />
        <p className="text-[11px] text-muted-foreground">
          Enter para quebrar o título onde quiser (até 5 linhas). Shift+Enter também funciona.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-border/40 p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor="hero-bio" className="text-sm font-semibold">
            Parágrafo
          </Label>
          <InlineColorField
            id="hero-bio-color"
            label="Cor do texto"
            value={content.bioColor}
            fallback="#64748b"
            onChange={(v) => onChange({ ...content, bioColor: v })}
          />
        </div>
        <Textarea
          id="hero-bio"
          value={content.bio}
          onChange={(e: FormChangeEvent) => onChange({ ...content, bio: e.target.value })}
          rows={4}
          maxLength={2000}
          placeholder="Quem ajudam, como trabalham, em que região…"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 bg-background p-2.5 text-sm has-[:checked]:border-brand/40 has-[:checked]:bg-brand/[0.04]">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={content.showLogo !== false}
          onChange={(e) => onChange({ ...content, showLogo: e.target.checked })}
        />
        <span>
          <span className="font-medium">Mostrar logótipo no destaque</span>
          <span className="mt-0.5 block text-[11px] text-muted-foreground">
            Círculo por cima do fundo, acima do título. Pode ocultar e manter só na barra do topo.
          </span>
        </span>
      </label>

      <SectionCtasEditor
        ctas={content.ctas || []}
        services={services}
        officePhone={officePhone}
        socialWhatsapp={socialWhatsapp}
        onChange={(ctas) => onChange({ ...content, ctas })}
      />
    </div>
  )
}

export function AboutEditor({
  content,
  onChange,
  imageUrl,
  uploadingImage,
  onUploadImage,
  onRemoveImage,
  services,
  officePhone,
  socialWhatsapp,
  sectionMedia,
}: {
  content: PublicSiteAboutContent
  onChange: (next: PublicSiteAboutContent) => void
  imageUrl: string | null
  uploadingImage: boolean
  onUploadImage: (file: File) => void
  onRemoveImage: () => void
  services: PublicFirmServiceSummary[]
  officePhone?: string | null
  socialWhatsapp?: string | null
  sectionMedia?: SectionMediaEditorProps<PublicSiteAboutContent>
}) {
  return (
    <div className="space-y-4">
      {sectionMedia ? (
        <SectionMediaEditor {...sectionMedia} contentLabel="Foto (ex.: retrato)" />
      ) : (
        <ImagePickerField
          label="Foto (opcional)"
          imageUrl={imageUrl}
          uploading={uploadingImage}
          onUpload={onUploadImage}
          onRemove={onRemoveImage}
          skipCrop
          previewVariant="section"
          previewFit={normalizeSectionImageFit(content.imageFit)}
          previewFocusX={content.imageFocusX}
          previewFocusY={content.imageFocusY}
          previewZoom={content.imageZoom}
        />
      )}
      <InlineColorField
        id="about-bg"
        label="Cor de fundo da secção"
        value={content.backgroundColor}
        fallback="#ffffff"
        onChange={(v) => onChange({ ...content, backgroundColor: v })}
      />
      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label>Título</Label>
          <InlineColorField
            id="about-heading-color"
            label="Cor do título"
            value={content.headingColor}
            onChange={(v) => onChange({ ...content, headingColor: v })}
          />
        </div>
        <Input
          value={content.heading}
          onChange={(e: FormChangeEvent) => onChange({ ...content, heading: e.target.value })}
          placeholder="Ex.: Sobre nós"
          maxLength={160}
        />
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label>Texto</Label>
          <InlineColorField
            id="about-body-color"
            label="Cor do texto"
            value={content.bodyColor}
            fallback="#64748b"
            onChange={(v) => onChange({ ...content, bodyColor: v })}
          />
        </div>
        <Textarea
          value={content.body}
          onChange={(e: FormChangeEvent) => onChange({ ...content, body: e.target.value })}
          rows={5}
          maxLength={4000}
        />
      </div>
      <SectionCtasEditor
        ctas={content.ctas || []}
        services={services}
        officePhone={officePhone}
        socialWhatsapp={socialWhatsapp}
        onChange={(ctas) => onChange({ ...content, ctas })}
      />
    </div>
  )
}

function ReorderButtons({
  index,
  total,
  onMove,
  label,
}: {
  index: number
  total: number
  onMove: (from: number, to: number) => void
  label: string
}) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={index <= 0}
        aria-label={`Subir ${label}`}
        onClick={() => onMove(index, index - 1)}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={index >= total - 1}
        aria-label={`Descer ${label}`}
        onClick={() => onMove(index, index + 1)}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function ServicesHeadingEditor({
  content,
  onChange,
  services,
  officePhone,
  socialWhatsapp,
  bookingFilter,
}: {
  content: PublicSiteServicesContent
  onChange: (next: PublicSiteServicesContent) => void
  services: PublicFirmServiceSummary[]
  officePhone?: string | null
  socialWhatsapp?: string | null
  /** true = consultorias com agendamento; false = outros serviços */
  bookingFilter?: boolean
}) {
  const queryClient = useQueryClient()
  const catalogQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'public-site-order'],
    queryFn: () => contabilAccountingServicesApi.list({ activeOnly: true }),
    staleTime: 15_000,
  })
  const [reordering, setReordering] = useState(false)

  const firmServices: AccountingService[] = Array.isArray(catalogQuery.data?.items)
    ? catalogQuery.data.items
    : Array.isArray(catalogQuery.data)
      ? catalogQuery.data
      : []

  const sectionServices = firmServices
    .filter((s) => s.isPubliclyListed && s.isActive !== false)
    .filter((s) => (bookingFilter == null ? true : Boolean(s.requiresBooking) === bookingFilter))
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const reorderServices = async (from: number, to: number) => {
    const a = sectionServices[from]
    const b = sectionServices[to]
    if (!a || !b) return
    setReordering(true)
    try {
      // Troca só os sortOrder dos dois vizinhos — não reaplica a lista filtrada
      // (evita baralhar serviços da outra secção / inactivos).
      const orderA = a.sortOrder ?? from * 10
      const orderB = b.sortOrder ?? to * 10
      await Promise.all([
        contabilAccountingServicesApi.patch(a.id, { sortOrder: orderB }),
        contabilAccountingServicesApi.patch(b.id, { sortOrder: orderA }),
      ])
      await queryClient.invalidateQueries({ queryKey: ['contabil-accounting-services'] })
      await queryClient.invalidateQueries({ queryKey: ['public-firm-services-preview'] })
      toast.success('Ordem dos serviços actualizada')
    } catch (err) {
      toast.error('Não foi possível reordenar', { description: getErrorMessage(err) })
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <InlineColorField
          id="services-bg"
          label="Cor de fundo da secção"
          value={content.backgroundColor}
          fallback="#faf9f7"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
        <InlineColorField
          id="services-heading-color"
          label="Cor do título"
          value={content.headingColor}
          onChange={(v) => onChange({ ...content, headingColor: v })}
        />
      </div>
      <div className="space-y-2 rounded-lg border border-border/40 p-3">
        <Label className="text-sm font-semibold">1 · Título no topo da secção</Label>
        <Input
          value={content.heading}
          onChange={(e: FormChangeEvent) => onChange({ ...content, heading: e.target.value })}
          placeholder="Opcional — ex.: Consultorias, Outros serviços"
          maxLength={160}
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Texto pequeno em maiúsculas acima dos serviços.{' '}
          <span className="font-medium">Só aparece na página se escrever aqui.</span> Os serviços vêm do catálogo
          (Serviços → marque «Aparece na página pública»).
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-brand/25 bg-brand/[0.03] p-3">
        <div>
          <Label className="text-sm font-semibold">2 · Cartões em destaque (opcional)</Label>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Marque até 12 ofertas para cartões grandes com modalidades. Se não marcar nenhuma, só vê a lista/grelha de
            serviços.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="featured-heading" className="text-caption text-muted-foreground">
            Título acima dos cartões
          </Label>
          <Input
            id="featured-heading"
            value={content.featuredHeading || ''}
            onChange={(e: FormChangeEvent) => onChange({ ...content, featuredHeading: e.target.value })}
            placeholder="Opcional — ex.: Destaques, Ofertas principais"
            maxLength={80}
          />
          <p className="text-[11px] text-muted-foreground">
            Só aparece se preencher <span className="font-medium">e</span> tiver cartões seleccionados abaixo.
          </p>
        </div>
        {catalogQuery.isLoading ? null : sectionServices.length === 0 ? null : (
          <ul className="space-y-1.5">
            {sectionServices.map((svc) => {
              const slug = String(svc.slug || '').trim()
              if (!slug) return null
              const featured = content.featuredServiceSlugs || []
              const checked = featured.includes(slug)
              const atMax = featured.length >= 12 && !checked
              return (
                <li key={svc.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded-md border border-border/40 bg-background px-2.5 py-2 text-sm',
                      atMax && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked}
                      disabled={atMax}
                      onChange={() => {
                        const next = new Set(featured)
                        if (next.has(slug)) next.delete(slug)
                        else next.add(slug)
                        onChange({ ...content, featuredServiceSlugs: [...next] })
                      }}
                    />
                    <span className="min-w-0">
                      <span className="font-medium">{svc.name}</span>
                      {(svc.options?.length || 0) > 0 ? (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {svc.options!.length} modalidades
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
        {(content.featuredServiceSlugs?.length ?? 0) > 0 ? (
          <div className="space-y-1 border-t border-border/30 pt-3">
            <Label htmlFor="catalog-heading" className="text-caption text-muted-foreground">
              3 · Título acima da restante lista de serviços
            </Label>
            <Input
              id="catalog-heading"
              value={content.catalogHeading || ''}
              onChange={(e: FormChangeEvent) => onChange({ ...content, catalogHeading: e.target.value })}
              placeholder="Opcional — ex.: Catálogo completo, Todas as ofertas"
              maxLength={80}
            />
            <p className="text-[11px] text-muted-foreground">
              Só faz sentido quando há cartões em destaque: separa os cartões da grelha com o resto dos serviços. Em
              branco = sem este subtítulo na página.
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 rounded-lg border border-border/40 p-3">
        <Label className="text-sm font-semibold">Ordem no catálogo</Label>
        {catalogQuery.isLoading ? (
          <p className="text-caption text-muted-foreground">A carregar catálogo…</p>
        ) : sectionServices.length === 0 ? (
          <p className="text-caption text-muted-foreground">
            Ainda não há serviços públicos
            {bookingFilter === true ? ' com agendamento' : bookingFilter === false ? ' sem agendamento' : ''}
            . Active «Aparece na página pública» em Serviços.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {sectionServices.map((svc, index) => (
              <li
                key={svc.id}
                className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/10 px-2 py-1.5"
              >
                <ReorderButtons
                  index={index}
                  total={sectionServices.length}
                  onMove={(from, to) => {
                    if (!reordering) void reorderServices(from, to)
                  }}
                  label={svc.name}
                />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{svc.name}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-muted-foreground">
          A ordem fica guardada no catálogo de Serviços (não cria cópias).
        </p>
      </div>

      <SectionCtasEditor
        ctas={content.ctas || []}
        services={services}
        officePhone={officePhone}
        socialWhatsapp={socialWhatsapp}
        onChange={(ctas) => onChange({ ...content, ctas })}
      />
    </div>
  )
}

export function FeaturesEditor({
  content,
  onChange,
  sectionMedia,
}: {
  content: PublicSiteFeaturesContent
  onChange: (next: PublicSiteFeaturesContent) => void
  sectionMedia?: SectionMediaEditorProps<PublicSiteFeaturesContent>
}) {
  const addItem = () => onChange({ ...content, items: [...content.items, { id: generateStableId('feat_'), title: '', description: '' }] })
  const patchItem = (id: string, patch: Partial<PublicSiteFeaturesContent['items'][number]>) =>
    onChange({ ...content, items: content.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const removeItem = (id: string) => onChange({ ...content, items: content.items.filter((it) => it.id !== id) })

  return (
    <div className="space-y-3">
      {sectionMedia ? <SectionMediaEditor {...sectionMedia} contentLabel="Imagem ilustrativa" /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <InlineColorField
          id="feat-bg"
          label="Fundo"
          value={content.backgroundColor}
          fallback="#ffffff"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
        <InlineColorField
          id="feat-title"
          label="Cor dos títulos"
          value={content.titleColor}
          onChange={(v) => onChange({ ...content, titleColor: v })}
        />
        <InlineColorField
          id="feat-text"
          label="Cor dos textos"
          value={content.textColor}
          fallback="#64748b"
          onChange={(v) => onChange({ ...content, textColor: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Diferenciais</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>
      {content.items.map((it, index) => (
        <div key={it.id} className="flex gap-2 rounded-lg border border-border/50 p-3">
          <ReorderButtons
            index={index}
            total={content.items.length}
            label={it.title || `diferencial ${index + 1}`}
            onMove={(from, to) => onChange({ ...content, items: moveItemInArray(content.items, from, to) })}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Input value={it.title} onChange={(e: FormChangeEvent) => patchItem(it.id, { title: e.target.value })} placeholder="Título" maxLength={120} />
            <Textarea value={it.description} onChange={(e: FormChangeEvent) => patchItem(it.id, { description: e.target.value })} placeholder="Descrição" rows={2} maxLength={400} />
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(it.id)} aria-label="Remover">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function ProcessEditor({
  content,
  onChange,
  sectionMedia,
}: {
  content: PublicSiteProcessContent
  onChange: (next: PublicSiteProcessContent) => void
  sectionMedia?: SectionMediaEditorProps<PublicSiteProcessContent>
}) {
  const addStep = () => onChange({ ...content, steps: [...content.steps, { id: generateStableId('step_'), title: '', description: '' }] })
  const patchStep = (id: string, patch: Partial<PublicSiteProcessContent['steps'][number]>) =>
    onChange({ ...content, steps: content.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  const removeStep = (id: string) => onChange({ ...content, steps: content.steps.filter((s) => s.id !== id) })

  return (
    <div className="space-y-3">
      {sectionMedia ? <SectionMediaEditor {...sectionMedia} contentLabel="Imagem ilustrativa" /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <InlineColorField
          id="process-bg"
          label="Fundo"
          value={content.backgroundColor}
          fallback="#ffffff"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
        <InlineColorField
          id="process-title"
          label="Cor dos títulos"
          value={content.titleColor}
          onChange={(v) => onChange({ ...content, titleColor: v })}
        />
        <InlineColorField
          id="process-text"
          label="Cor dos textos"
          value={content.textColor}
          fallback="#64748b"
          onChange={(v) => onChange({ ...content, textColor: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Como funciona (passos)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addStep}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar passo
        </Button>
      </div>
      {content.steps.map((s, index) => (
        <div key={s.id} className="flex gap-2 rounded-lg border border-border/50 p-3">
          <ReorderButtons
            index={index}
            total={content.steps.length}
            label={s.title || `passo ${index + 1}`}
            onMove={(from, to) => onChange({ ...content, steps: moveItemInArray(content.steps, from, to) })}
          />
          <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span>
          <div className="min-w-0 flex-1 space-y-2">
            <Input value={s.title} onChange={(e: FormChangeEvent) => patchStep(s.id, { title: e.target.value })} placeholder="Título do passo" maxLength={120} />
            <Textarea value={s.description} onChange={(e: FormChangeEvent) => patchStep(s.id, { description: e.target.value })} placeholder="Descrição" rows={2} maxLength={400} />
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeStep(s.id)} aria-label="Remover">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function FaqEditor({
  content,
  onChange,
  sectionMedia,
}: {
  content: PublicSiteFaqContent
  onChange: (next: PublicSiteFaqContent) => void
  sectionMedia?: SectionMediaEditorProps<PublicSiteFaqContent>
}) {
  const addItem = () => onChange({ ...content, items: [...content.items, { id: generateStableId('faq_'), question: '', answer: '' }] })
  const patchItem = (id: string, patch: Partial<PublicSiteFaqContent['items'][number]>) =>
    onChange({ ...content, items: content.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const removeItem = (id: string) => onChange({ ...content, items: content.items.filter((it) => it.id !== id) })

  return (
    <div className="space-y-3">
      {sectionMedia ? <SectionMediaEditor {...sectionMedia} contentLabel="Imagem ilustrativa (opcional)" /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <InlineColorField
          id="faq-bg"
          label="Fundo"
          value={content.backgroundColor}
          fallback="#ffffff"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
        <InlineColorField
          id="faq-title"
          label="Cor das perguntas"
          value={content.titleColor}
          onChange={(v) => onChange({ ...content, titleColor: v })}
        />
        <InlineColorField
          id="faq-text"
          label="Cor das respostas"
          value={content.textColor}
          fallback="#64748b"
          onChange={(v) => onChange({ ...content, textColor: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Perguntas frequentes</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar pergunta
        </Button>
      </div>
      {content.items.map((it, index) => (
        <div key={it.id} className="flex gap-2 rounded-lg border border-border/50 p-3">
          <ReorderButtons
            index={index}
            total={content.items.length}
            label={it.question || `pergunta ${index + 1}`}
            onMove={(from, to) => onChange({ ...content, items: moveItemInArray(content.items, from, to) })}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Input value={it.question} onChange={(e: FormChangeEvent) => patchItem(it.id, { question: e.target.value })} placeholder="Pergunta" maxLength={200} />
            <Textarea value={it.answer} onChange={(e: FormChangeEvent) => patchItem(it.id, { answer: e.target.value })} placeholder="Resposta" rows={2} maxLength={2000} />
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(it.id)} aria-label="Remover">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

function PublicSiteContactFieldRow({
  id,
  label,
  showChecked,
  onShowChange,
  showToggleLabel,
  children,
}: {
  id: string
  label: string
  showChecked?: boolean
  onShowChange?: (show: boolean) => void
  showToggleLabel: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Label htmlFor={id}>{label}</Label>
        {onShowChange ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={showChecked === true}
              onCheckedChange={(v: boolean | 'indeterminate') => onShowChange(v === true)}
            />
            {showToggleLabel}
          </label>
        ) : null}
      </div>
      {children}
    </div>
  )
}

export function PublicSiteContactDetailsFields({
  email,
  phone,
  address,
  officeContact,
  onChange,
  idPrefix = 'contact',
  visibility,
  onVisibilityChange,
}: {
  email: string | null | undefined
  phone: string | null | undefined
  address: string | null | undefined
  officeContact?: { email?: string | null; phone?: string | null; address?: string | null }
  onChange: (patch: { email?: string | null; phone?: string | null; address?: string | null }) => void
  idPrefix?: string
  visibility?: { showEmail: boolean; showPhone: boolean; showAddress: boolean }
  onVisibilityChange?: (patch: Partial<{ showEmail: boolean; showPhone: boolean; showAddress: boolean }>) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/40 p-3">
      <div>
        <Label className="text-sm font-semibold">Email, telefone e morada</Label>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Aparecem na secção Contactos e redes. Campo em branco → usa Definições → Escritório. Desactive «Mostrar» para
          ocultar na página (o rodapé legal mantém só políticas e links institucionais).
        </p>
      </div>
      <PublicSiteContactFieldRow
        id={`${idPrefix}-email`}
        label="Email"
        showChecked={visibility?.showEmail}
        onShowChange={
          onVisibilityChange ? (show) => onVisibilityChange({ showEmail: show }) : undefined
        }
        showToggleLabel="Mostrar e-mail"
      >
        <Input
          id={`${idPrefix}-email`}
          type="email"
          value={email || ''}
          onChange={(e: FormChangeEvent) => onChange({ email: e.target.value || null })}
          placeholder={officeContact?.email || 'Ex.: contacto@empresa.pt'}
          maxLength={200}
        />
      </PublicSiteContactFieldRow>
      <PublicSiteContactFieldRow
        id={`${idPrefix}-phone`}
        label="Telefone"
        showChecked={visibility?.showPhone}
        onShowChange={
          onVisibilityChange ? (show) => onVisibilityChange({ showPhone: show }) : undefined
        }
        showToggleLabel="Mostrar telefone"
      >
        <Input
          id={`${idPrefix}-phone`}
          value={phone || ''}
          onChange={(e: FormChangeEvent) => onChange({ phone: e.target.value || null })}
          placeholder={officeContact?.phone || 'Ex.: +351 …'}
          maxLength={40}
        />
      </PublicSiteContactFieldRow>
      <PublicSiteContactFieldRow
        id={`${idPrefix}-address`}
        label="Morada"
        showChecked={visibility?.showAddress}
        onShowChange={
          onVisibilityChange ? (show) => onVisibilityChange({ showAddress: show }) : undefined
        }
        showToggleLabel="Mostrar morada"
      >
        <Input
          id={`${idPrefix}-address`}
          value={address || ''}
          onChange={(e: FormChangeEvent) => onChange({ address: e.target.value || null })}
          placeholder={officeContact?.address || 'Ex.: Rua …, Coimbra'}
          maxLength={300}
        />
        <p className="text-[11px] text-muted-foreground">Na página pública abre o Google Maps ao clicar.</p>
      </PublicSiteContactFieldRow>
    </div>
  )
}

export function ContactEditor({
  content,
  onChange,
  services,
  officePhone,
  socialWhatsapp,
  sectionMedia,
  footerContact,
  onFooterContactChange,
  officeContact,
  socialLinksSection,
}: {
  content: PublicSiteContactContent
  onChange: (next: PublicSiteContactContent) => void
  services: PublicFirmServiceSummary[]
  officePhone?: string | null
  socialWhatsapp?: string | null
  sectionMedia?: SectionMediaEditorProps<PublicSiteContactContent>
  footerContact?: { email?: string | null; phone?: string | null; address?: string | null }
  onFooterContactChange?: (patch: { email?: string | null; phone?: string | null; address?: string | null }) => void
  officeContact?: { email?: string | null; phone?: string | null; address?: string | null }
  socialLinksSection?: ReactNode
}) {
  return (
    <div className="space-y-4">
      {onFooterContactChange ? (
        <PublicSiteContactDetailsFields
          email={footerContact?.email}
          phone={footerContact?.phone}
          address={footerContact?.address}
          officeContact={officeContact}
          onChange={onFooterContactChange}
          visibility={{
            showEmail: content.showEmail,
            showPhone: content.showPhone,
            showAddress: content.showAddress,
          }}
          onVisibilityChange={(patch) => onChange({ ...content, ...patch })}
        />
      ) : null}
      {socialLinksSection ? (
        <div className="space-y-2 rounded-lg border border-border/40 p-3">
          <Label className="text-sm font-semibold">Redes sociais e site</Label>
          <p className="text-[11px] text-muted-foreground">
            Ícones na secção Contactos e redes (não no rodapé legal).
          </p>
          {socialLinksSection}
        </div>
      ) : null}
      {sectionMedia ? <SectionMediaEditor {...sectionMedia} contentLabel="Imagem (opcional)" /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <InlineColorField
          id="contact-bg"
          label="Cor de fundo"
          value={content.backgroundColor}
          fallback="#faf9f7"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
        <InlineColorField
          id="contact-text"
          label="Cor do texto"
          value={content.textColor}
          fallback="#64748b"
          onChange={(v) => onChange({ ...content, textColor: v })}
        />
      </div>
      <SectionCtasEditor
        ctas={content.ctas || []}
        services={services}
        officePhone={officePhone}
        socialWhatsapp={socialWhatsapp}
        onChange={(ctas) => onChange({ ...content, ctas })}
      />
    </div>
  )
}

const MAX_PUBLIC_LOGO_MB = 3

const LOGO_SOURCE_OPTIONS: { value: PublicSiteLogoSource; label: string }[] = [
  { value: 'firm', label: 'Definições → Logótipo' },
  { value: 'custom', label: 'Imagem só desta página' },
  { value: 'none', label: 'Sem logótipo aqui' },
]

function ZoneLogoEditor({
  zone,
  title,
  draft,
  firmLogoUrl,
  readOnly,
  onDraftUpdate,
  onLogoSourceChange,
}: {
  zone: 'header' | 'hero'
  title: string
  draft: PublicSiteConfig
  firmLogoUrl: string | null
  readOnly: boolean
  onDraftUpdate: (next: PublicSiteConfig) => void
  onLogoSourceChange: (zone: 'header' | 'hero', source: PublicSiteLogoSource) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const source = zone === 'header' ? draft.theme.headerLogoSource ?? 'firm' : draft.theme.heroLogoSource ?? 'firm'
  const previewUrl = resolvePublicSitePreviewZoneLogoUrl(draft, zone, firmLogoUrl)

  const onUpload = async (file: File) => {
    if (readOnly) return
    if (file.size > MAX_PUBLIC_LOGO_MB * 1024 * 1024) {
      toast.error(`Imagem até ${MAX_PUBLIC_LOGO_MB} MB`)
      return
    }
    setUploading(true)
    try {
      const res = await firmPublicSiteApi.uploadPublicLogo(file, zone)
      onDraftUpdate(res.draft)
      toast.success(`Logótipo (${title}) guardado no rascunho.`)
    } catch (err) {
      toast.error('Não foi possível guardar o logótipo', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/40 p-2.5">
      <p className="text-[11px] font-semibold">{title}</p>
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        disabled={readOnly}
        value={source}
        onChange={(e) => onLogoSourceChange(zone, e.target.value as PublicSiteLogoSource)}
      >
        {LOGO_SOURCE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {previewUrl ? (
        <img src={previewUrl} alt="" className="h-14 w-14 rounded-md border border-border/50 object-contain" />
      ) : (
        <p className="text-[11px] text-muted-foreground">Nenhuma imagem nesta zona.</p>
      )}
      {source === 'custom' ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onUpload(file)
              e.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={readOnly || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Carregar imagem
          </Button>
        </>
      ) : null}
    </div>
  )
}

export function PublicSiteLogoCard({
  draft,
  firmLogoUrl,
  readOnly = false,
  onDraftUpdate,
  onLogoSourceChange,
  embedded = false,
}: {
  draft: PublicSiteConfig
  firmLogoUrl: string | null
  readOnly?: boolean
  onDraftUpdate: (next: PublicSiteConfig) => void
  onLogoSourceChange: (zone: 'header' | 'hero', source: PublicSiteLogoSource) => void
  /** Dentro do cartão «Identidade visual» — sem borda/título duplicados. */
  embedded?: boolean
}) {
  const grid = (
    <div className={`grid gap-3 ${embedded ? 'sm:grid-cols-2' : 'mt-2 grid gap-2 sm:grid-cols-2'}`}>
      <ZoneLogoEditor
        zone="header"
        title="Barra do topo"
        draft={draft}
        firmLogoUrl={firmLogoUrl}
        readOnly={readOnly}
        onDraftUpdate={onDraftUpdate}
        onLogoSourceChange={onLogoSourceChange}
      />
      <ZoneLogoEditor
        zone="hero"
        title="Destaque principal"
        draft={draft}
        firmLogoUrl={firmLogoUrl}
        readOnly={readOnly}
        onDraftUpdate={onDraftUpdate}
        onLogoSourceChange={onLogoSourceChange}
      />
    </div>
  )

  if (embedded) return grid

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3">
      <p className="text-xs font-semibold text-foreground">Logótipos (só site público)</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Independentes de Definições → Logótipo (portal). Pode ser diferente na barra e no destaque, ou sem imagem.
      </p>
      {grid}
    </div>
  )
}
