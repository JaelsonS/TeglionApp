import { useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon, Loader2, Plus, Trash2, X } from 'lucide-react'

import { PublicSiteHeroBanner } from '@/features/public-intake/PublicSiteHeroBanner'
import {
  normalizeHeroImageFit,
  normalizeHeroImagePosition,
  type PublicSiteHeroImageFit,
  type PublicSiteHeroImagePosition,
} from '@/features/public-intake/publicSiteHeroBanner'
import { Button } from '@/shared/components/ui/button'
import { ImageCropDialog, type ImageCropAspect } from '@/shared/components/media/ImageCropDialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import type { FormChangeEvent } from '@/shared/types/react-events'
import type {
  PublicSiteAboutContent,
  PublicSiteChromeContent,
  PublicSiteContactContent,
  PublicSiteCta,
  PublicSiteFaqContent,
  PublicSiteFeaturesContent,
  PublicSiteHeroContent,
  PublicSiteProcessContent,
  PublicSiteServicesContent,
} from '@/shared/types/firmPublicSite'
import type { PublicFirmServiceSummary } from '@/infrastructure/api/contabil/public'

const CTA_TARGET_OPTIONS: { value: PublicSiteCta['target']['type']; label: string }[] = [
  { value: 'external-url', label: 'Link externo' },
  { value: 'booking', label: 'Ver serviços' },
  { value: 'service-detail', label: 'Um serviço específico' },
  { value: 'contact-form', label: 'Secção de contactos' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

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
  previewBackgroundColor,
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
  previewPosition?: PublicSiteHeroImagePosition | null
  previewBackgroundColor?: string | null
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
      {imageUrl ? (
        <div className="relative w-full overflow-hidden rounded-lg border border-border/50">
          {skipCrop ? (
            <PublicSiteHeroBanner
              src={imageUrl}
              alt=""
              fit={previewFit}
              position={previewPosition}
              backgroundColor={previewBackgroundColor}
            />
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
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="mr-1.5 h-3.5 w-3.5" />}
          Adicionar foto
        </Button>
      )}
      {imageUrl && skipCrop ? (
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

export function ChromeSectionEditor({
  content,
  onChange,
  title,
  showTitleField = false,
  titleFieldLabel = 'Texto desta zona',
  titlePlaceholder,
  titleHint,
}: {
  content: PublicSiteChromeContent
  onChange: (next: PublicSiteChromeContent) => void
  title: string
  /** Cabeçalho: override opcional do nome público. */
  showTitleField?: boolean
  titleFieldLabel?: string
  titlePlaceholder?: string
  titleHint?: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground">
        Cores só desta zona ({title}). Em branco = padrão da página.
      </p>
      {showTitleField ? (
        <div className="space-y-2">
          <Label htmlFor={`${title}-label`}>{titleFieldLabel}</Label>
          <Input
            id={`${title}-label`}
            value={content.title || ''}
            onChange={(e: FormChangeEvent) => onChange({ ...content, title: e.target.value })}
            placeholder={titlePlaceholder || 'Deixe vazio para usar o nome público'}
            maxLength={120}
          />
          <p className="text-[11px] text-muted-foreground">
            {titleHint ||
              'Opcional. Se vazio, a barra do topo usa o «Nome na barra do topo» definido acima.'}
          </p>
        </div>
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

export function HeroEditor({
  content,
  onChange,
  imageUrl,
  uploadingImage,
  onUploadImage,
  onRemoveImage,
  services,
  publicDisplayName: _publicDisplayName,
}: {
  content: PublicSiteHeroContent
  onChange: (next: PublicSiteHeroContent) => void
  imageUrl: string | null
  uploadingImage: boolean
  onUploadImage: (file: File) => void
  onRemoveImage: () => void
  services: PublicFirmServiceSummary[]
  /** Nome do header — disponível para a Maya / callers; UI limpa sem parede de texto. */
  publicDisplayName?: string
}) {
  const addCta = () => {
    onChange({
      ...content,
      ctas: [
        ...content.ctas,
        {
          id: generateStableId('cta_'),
          label: '',
          style: 'primary',
          backgroundColor: null,
          textColor: null,
          target: { type: 'external-url', url: '' },
        } as PublicSiteCta,
      ],
    })
  }
  const patchCta = (id: string, patch: Partial<PublicSiteCta>) => {
    onChange({ ...content, ctas: content.ctas.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  }
  const removeCta = (id: string) => {
    onChange({ ...content, ctas: content.ctas.filter((c) => c.id !== id) })
  }

  const imageFit = normalizeHeroImageFit(content.imageFit)
  const imagePosition = normalizeHeroImagePosition(content.imagePosition)

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-lg border border-border/40 bg-muted/10 p-3">
        <p className="text-sm font-semibold">1. Imagem de capa</p>
        <ImagePickerField
          label="Foto (qualquer proporção)"
          imageUrl={imageUrl}
          uploading={uploadingImage}
          onUpload={onUploadImage}
          onRemove={onRemoveImage}
          skipCrop
          previewFit={imageFit}
          previewPosition={imagePosition}
          previewBackgroundColor={content.backgroundColor}
        />
        <p className="text-[11px] text-muted-foreground">
          A imagem original é guardada. O enquadramento abaixo aplica-se na Página Pública — o
          preview é o mesmo que o visitante vê.
        </p>
        <fieldset className="space-y-2">
          <legend className="text-caption font-medium text-muted-foreground">Enquadramento</legend>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 bg-background p-2.5 text-sm has-[:checked]:border-brand/40 has-[:checked]:bg-brand/[0.04]">
            <input
              type="radio"
              name="hero-image-fit"
              className="mt-0.5"
              checked={imageFit === 'cover'}
              onChange={() => onChange({ ...content, imageFit: 'cover' })}
            />
            <span>
              <span className="font-medium">Preencher</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                A foto ocupa toda a faixa. Pode cortar bordas — adequado para fotografias.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/50 bg-background p-2.5 text-sm has-[:checked]:border-brand/40 has-[:checked]:bg-brand/[0.04]">
            <input
              type="radio"
              name="hero-image-fit"
              className="mt-0.5"
              checked={imageFit === 'contain'}
              onChange={() => onChange({ ...content, imageFit: 'contain' })}
            />
            <span>
              <span className="font-medium">Mostrar tudo</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                A imagem aparece inteira. A cor de fundo preenche o espaço restante — adequado
                para cartazes, texto ou logótipos.
              </span>
            </span>
          </label>
        </fieldset>
        {imageFit === 'cover' ? (
          <div className="space-y-1">
            <p className="text-caption text-muted-foreground">Foco (se a foto for cortada)</p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['top', 'Topo'],
                  ['center', 'Centro'],
                  ['bottom', 'Base'],
                ] as const
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={imagePosition === value ? 'primary' : 'outline'}
                  className="h-8"
                  onClick={() => onChange({ ...content, imagePosition: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <InlineColorField
          id="hero-bg"
          label="Cor de fundo"
          value={content.backgroundColor}
          fallback="#e8f0ec"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
      </div>

      <div className="space-y-2 rounded-lg border border-brand/25 bg-brand/[0.03] p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor="hero-title" className="text-sm font-semibold">
            2. Título grande
          </Label>
          <InlineColorField
            id="hero-title-color"
            label="Cor do título"
            value={content.titleColor}
            onChange={(v) => onChange({ ...content, titleColor: v })}
          />
        </div>
        <Input
          id="hero-title"
          value={content.title || ''}
          onChange={(e: FormChangeEvent) => onChange({ ...content, title: e.target.value })}
          placeholder="Ex.: Contabilidade clara para o seu negócio"
          maxLength={120}
        />
      </div>

      <div className="space-y-2 rounded-lg border border-brand/25 bg-brand/[0.03] p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor="hero-tagline" className="text-sm font-semibold">
            3. Frase de destaque
          </Label>
          <InlineColorField
            id="hero-tagline-color"
            label="Cor da frase"
            value={content.taglineColor}
            onChange={(v) => onChange({ ...content, taglineColor: v })}
          />
        </div>
        <Input
          id="hero-tagline"
          value={content.tagline}
          onChange={(e: FormChangeEvent) => onChange({ ...content, tagline: e.target.value })}
          placeholder="Ex.: Fiscalidade moderna para negócios e profissionais em Lisboa"
          maxLength={160}
        />
      </div>

      <div className="space-y-2 rounded-lg border border-border/40 p-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label htmlFor="hero-bio" className="text-sm font-semibold">
            4. Parágrafo
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

      <div className="space-y-2 rounded-lg border border-border/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-semibold">5. Botões</Label>
          {content.ctas.length < 3 ? (
            <Button type="button" variant="outline" size="sm" onClick={addCta}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar botão
            </Button>
          ) : null}
        </div>
        {content.ctas.map((cta, index) => (
          <div key={cta.id} className="space-y-2 rounded-lg border border-border/50 bg-muted/5 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={cta.label}
                onChange={(e: FormChangeEvent) => patchCta(cta.id, { label: e.target.value })}
                placeholder={`Texto do botão ${index + 1}`}
                className="flex-1 basis-40"
                maxLength={80}
              />
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={cta.target.type}
                onChange={(e) =>
                  patchCta(cta.id, {
                    target:
                      e.target.value === 'external-url'
                        ? { type: 'external-url', url: '' }
                        : e.target.value === 'service-detail'
                          ? { type: 'service-detail', serviceId: services[0]?.slug }
                          : { type: e.target.value as PublicSiteCta['target']['type'] },
                  })
                }
              >
                {CTA_TARGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {cta.target.type === 'external-url' ? (
                <Input
                  value={cta.target.url || ''}
                  onChange={(e: FormChangeEvent) =>
                    patchCta(cta.id, { target: { type: 'external-url', url: e.target.value } })
                  }
                  placeholder="https://…"
                  className="w-40"
                />
              ) : null}
              {cta.target.type === 'service-detail' ? (
                services.length > 0 ? (
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
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
                  <span className="text-caption text-muted-foreground">Sem serviços públicos ainda</span>
                )
              ) : null}
              <Button type="button" variant="ghost" size="icon" onClick={() => removeCta(cta.id)} aria-label="Remover botão">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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
        ))}
      </div>
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
}: {
  content: PublicSiteAboutContent
  onChange: (next: PublicSiteAboutContent) => void
  imageUrl: string | null
  uploadingImage: boolean
  onUploadImage: (file: File) => void
  onRemoveImage: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-border/40 bg-muted/10 p-3">
        <p className="text-caption font-medium">Fundo da secção</p>
        <ImagePickerField
          label="Foto (opcional)"
          imageUrl={imageUrl}
          uploading={uploadingImage}
          onUpload={onUploadImage}
          onRemove={onRemoveImage}
          cropAspect="free"
          cropTitle="Recortar foto"
        />
        <InlineColorField
          id="about-bg"
          label="Cor de fundo (em vez de / além da foto)"
          value={content.backgroundColor}
          fallback="#ffffff"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
      </div>
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
    </div>
  )
}

export function ServicesHeadingEditor({
  content,
  onChange,
  placeholder,
}: {
  content: PublicSiteServicesContent
  onChange: (next: PublicSiteServicesContent) => void
  placeholder: string
}) {
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
      <div className="space-y-2">
        <Label>Título da secção</Label>
        <Input
          value={content.heading}
          onChange={(e: FormChangeEvent) => onChange({ ...content, heading: e.target.value })}
          placeholder={placeholder}
          maxLength={160}
        />
        <p className="text-caption text-muted-foreground">
          Os serviços aparecem automaticamente a partir do catálogo em Serviços — active «Aparece na página pública» em
          cada um.
        </p>
      </div>
    </div>
  )
}

export function FeaturesEditor({
  content,
  onChange,
}: {
  content: PublicSiteFeaturesContent
  onChange: (next: PublicSiteFeaturesContent) => void
}) {
  const addItem = () => onChange({ ...content, items: [...content.items, { id: generateStableId('feat_'), title: '', description: '' }] })
  const patchItem = (id: string, patch: Partial<PublicSiteFeaturesContent['items'][number]>) =>
    onChange({ ...content, items: content.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const removeItem = (id: string) => onChange({ ...content, items: content.items.filter((it) => it.id !== id) })

  return (
    <div className="space-y-3">
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
      {content.items.map((it) => (
        <div key={it.id} className="flex gap-2 rounded-lg border border-border/50 p-3">
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
}: {
  content: PublicSiteProcessContent
  onChange: (next: PublicSiteProcessContent) => void
}) {
  const addStep = () => onChange({ ...content, steps: [...content.steps, { id: generateStableId('step_'), title: '', description: '' }] })
  const patchStep = (id: string, patch: Partial<PublicSiteProcessContent['steps'][number]>) =>
    onChange({ ...content, steps: content.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  const removeStep = (id: string) => onChange({ ...content, steps: content.steps.filter((s) => s.id !== id) })

  return (
    <div className="space-y-3">
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

export function FaqEditor({ content, onChange }: { content: PublicSiteFaqContent; onChange: (next: PublicSiteFaqContent) => void }) {
  const addItem = () => onChange({ ...content, items: [...content.items, { id: generateStableId('faq_'), question: '', answer: '' }] })
  const patchItem = (id: string, patch: Partial<PublicSiteFaqContent['items'][number]>) =>
    onChange({ ...content, items: content.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const removeItem = (id: string) => onChange({ ...content, items: content.items.filter((it) => it.id !== id) })

  return (
    <div className="space-y-3">
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
      {content.items.map((it) => (
        <div key={it.id} className="flex gap-2 rounded-lg border border-border/50 p-3">
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

export function ContactEditor({ content, onChange }: { content: PublicSiteContactContent; onChange: (next: PublicSiteContactContent) => void }) {
  return (
    <div className="space-y-3">
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
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={content.showEmail}
          onCheckedChange={(v: boolean | 'indeterminate') => onChange({ ...content, showEmail: v === true })}
        />{' '}
        Mostrar e-mail
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={content.showPhone}
          onCheckedChange={(v: boolean | 'indeterminate') => onChange({ ...content, showPhone: v === true })}
        />{' '}
        Mostrar telefone
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={content.showAddress}
          onCheckedChange={(v: boolean | 'indeterminate') => onChange({ ...content, showAddress: v === true })}
        />{' '}
        Mostrar morada
      </label>
      <p className="text-caption text-muted-foreground">Editar os valores em Definições → Escritório.</p>
    </div>
  )
}
