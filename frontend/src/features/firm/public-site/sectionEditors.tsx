import { useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon, Loader2, Plus, Trash2, X } from 'lucide-react'

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
}: {
  label: string
  imageUrl: string | null
  uploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
  cropAspect?: ImageCropAspect
  cropTitle?: string
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
            setCropFile(file)
            setCropOpen(true)
          }
          e.target.value = ''
        }}
      />
      {imageUrl ? (
        <div className="relative w-full max-w-xs overflow-hidden rounded-lg border border-border/50">
          <img src={imageUrl} alt="" className="h-32 w-full object-cover" />
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
}: {
  content: PublicSiteChromeContent
  onChange: (next: PublicSiteChromeContent) => void
  title: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-caption text-muted-foreground">
        Escolha as cores só desta zona ({title}). Deixe em branco para usar o padrão da página.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <InlineColorField
          id={`${title}-bg`}
          label="Fundo desta zona (não é a cor do botão)"
          value={content.backgroundColor}
          fallback="#f0f4f1"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
        <InlineColorField
          id={`${title}-text`}
          label="Cor do texto desta zona"
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
}: {
  content: PublicSiteHeroContent
  onChange: (next: PublicSiteHeroContent) => void
  imageUrl: string | null
  uploadingImage: boolean
  onUploadImage: (file: File) => void
  onRemoveImage: () => void
  services: PublicFirmServiceSummary[]
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

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-lg border border-border/40 bg-muted/10 p-3">
        <p className="text-caption font-medium">Fundo da secção de destaque</p>
        <p className="text-[11px] text-muted-foreground">
          Cor ou foto do bloco atrás do texto. Para mudar a cor do botão em si, use «Cor do botão (call-to-action)»
          abaixo em cada botão — não este fundo.
        </p>
        <ImagePickerField
          label="Foto de capa (opcional)"
          imageUrl={imageUrl}
          uploading={uploadingImage}
          onUpload={onUploadImage}
          onRemove={onRemoveImage}
          cropAspect={16 / 9}
          cropTitle="Recortar foto de capa"
        />
        <InlineColorField
          id="hero-bg"
          label="Fundo da secção (atrás do texto)"
          value={content.backgroundColor}
          fallback="#e8f0ec"
          onChange={(v) => onChange({ ...content, backgroundColor: v })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label>Frase de destaque</Label>
          <InlineColorField
            id="hero-tagline-color"
            label="Cor da frase"
            value={content.taglineColor}
            onChange={(v) => onChange({ ...content, taglineColor: v })}
          />
        </div>
        <Input
          value={content.tagline}
          onChange={(e: FormChangeEvent) => onChange({ ...content, tagline: e.target.value })}
          placeholder="Ex.: Contabilidade & Finanças para empreendedores, empresas e particulares"
          maxLength={160}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <Label>Sobre o escritório (no destaque)</Label>
          <InlineColorField
            id="hero-bio-color"
            label="Cor do texto"
            value={content.bioColor}
            fallback="#64748b"
            onChange={(v) => onChange({ ...content, bioColor: v })}
          />
        </div>
        <Textarea
          value={content.bio}
          onChange={(e: FormChangeEvent) => onChange({ ...content, bio: e.target.value })}
          rows={4}
          maxLength={2000}
          placeholder="Um parágrafo curto sobre a sua forma de trabalhar."
        />
      </div>

      <InlineColorField
        id="hero-title-color"
        label="Cor do nome do escritório"
        value={content.titleColor}
        onChange={(v) => onChange({ ...content, titleColor: v })}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Botões de destaque (máx. 3)</Label>
          {content.ctas.length < 3 ? (
            <Button type="button" variant="outline" size="sm" onClick={addCta}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar botão
            </Button>
          ) : null}
        </div>
        {content.ctas.map((cta, index) => (
          <div key={cta.id} className="space-y-2 rounded-lg border border-border/50 p-3">
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
              <div className="space-y-1">
                <InlineColorField
                  id={`cta-bg-${cta.id}`}
                  label="Cor do botão (call-to-action)"
                  value={cta.backgroundColor}
                  fallback={cta.style === 'secondary' ? '#c9a24b' : '#12352a'}
                  onChange={(v) => patchCta(cta.id, { backgroundColor: v })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Cor do botão em si — diferente do «Fundo da secção» acima.
                </p>
              </div>
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
