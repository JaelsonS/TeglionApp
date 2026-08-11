import { useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { ExternalLink, Facebook, Globe, GripVertical, Instagram, Linkedin, Loader2, MessageCircle, Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import type { FirmPublicProfileFaq, FirmSettingsBundle } from '@/shared/types/firmSettings'
import { getErrorMessage } from '@/shared/utils/errors'
import { emitAppDataChanged } from '@/shared/utils/appEvents'

type Props = {
  bundle: FirmSettingsBundle
  onUpdated: () => void
}

function generateStableId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}${random}`
}

const HEX_RE = /^#[0-9a-f]{6}$/i

function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim())
}

export function FirmSettingsPublicPageSection({ bundle, onUpdated }: Props) {
  const canEdit = bundle.capabilities.canEditFirm
  const [tagline, setTagline] = useState(bundle.publicProfile.tagline ?? '')
  const [bio, setBio] = useState(bundle.publicProfile.bio ?? '')
  const [instagram, setInstagram] = useState(bundle.publicProfile.socialLinks.instagram ?? '')
  const [facebook, setFacebook] = useState(bundle.publicProfile.socialLinks.facebook ?? '')
  const [linkedin, setLinkedin] = useState(bundle.publicProfile.socialLinks.linkedin ?? '')
  const [whatsapp, setWhatsapp] = useState(bundle.publicProfile.socialLinks.whatsapp ?? '')
  const [website, setWebsite] = useState(bundle.publicProfile.socialLinks.website ?? '')
  const [faqs, setFaqs] = useState<FirmPublicProfileFaq[]>(bundle.publicProfile.faqs)
  const [primaryColor, setPrimaryColor] = useState(bundle.branding.primaryColor ?? '')
  const [secondaryColor, setSecondaryColor] = useState(bundle.branding.secondaryColor ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTagline(bundle.publicProfile.tagline ?? '')
    setBio(bundle.publicProfile.bio ?? '')
    setInstagram(bundle.publicProfile.socialLinks.instagram ?? '')
    setFacebook(bundle.publicProfile.socialLinks.facebook ?? '')
    setLinkedin(bundle.publicProfile.socialLinks.linkedin ?? '')
    setWhatsapp(bundle.publicProfile.socialLinks.whatsapp ?? '')
    setWebsite(bundle.publicProfile.socialLinks.website ?? '')
    setFaqs(bundle.publicProfile.faqs)
    setPrimaryColor(bundle.branding.primaryColor ?? '')
    setSecondaryColor(bundle.branding.secondaryColor ?? '')
  }, [bundle])

  const addFaq = () => {
    setFaqs((prev) => [...prev, { id: generateStableId('faq_'), question: '', answer: '' }])
  }

  const removeFaq = (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id))
  }

  const patchFaq = (id: string, patch: Partial<FirmPublicProfileFaq>) => {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  const primaryInvalid = primaryColor.trim() !== '' && !isValidHex(primaryColor)
  const secondaryInvalid = secondaryColor.trim() !== '' && !isValidHex(secondaryColor)

  const onSave = async () => {
    if (!canEdit) return
    if (primaryInvalid || secondaryInvalid) {
      toast.error('Cor inválida', { description: 'Use o formato hex #rrggbb (ex.: #12352a).' })
      return
    }
    setSaving(true)
    try {
      await Promise.all([
        firmSettingsApi.patchPublicProfile({
          tagline: tagline.trim() || null,
          bio: bio.trim() || null,
          socialLinks: {
            instagram: instagram.trim() || null,
            facebook: facebook.trim() || null,
            linkedin: linkedin.trim() || null,
            whatsapp: whatsapp.trim() || null,
            website: website.trim() || null,
          },
          faqs: faqs
            .map((f) => ({ id: f.id, question: f.question.trim(), answer: f.answer.trim() }))
            .filter((f) => f.question && f.answer),
        }),
        firmSettingsApi.patchBranding({
          primaryColor: primaryColor.trim() || null,
          secondaryColor: secondaryColor.trim() || null,
        }),
      ])
      emitAppDataChanged({ scope: 'branding' })
      toast.success('Página pública guardada.')
      onUpdated()
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="pagina-publica" className="cb-settings-panel scroll-mt-24 space-y-6">
      <div className="cb-settings-panel-hd">
        <span className="cb-settings-panel-icon">
          <Globe className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="cb-settings-panel-title">Página pública</h2>
          <p className="cb-settings-panel-sub">
            {canEdit
              ? 'O que aparece em teglion.com/o-seu-link — puxa automaticamente os serviços que activou.'
              : 'Apenas o dono do escritório pode editar estes campos.'}
          </p>
        </div>
        {bundle.firm.slug ? (
          <a
            href={`/${encodeURIComponent(bundle.firm.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-brand/40 hover:text-foreground"
          >
            Ver página pública <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pp-tagline">Frase de destaque</Label>
          <Input
            id="pp-tagline"
            value={tagline}
            onChange={(e: FormChangeEvent) => setTagline(e.target.value)}
            disabled={!canEdit || saving}
            placeholder="Ex.: Contabilidade & Finanças para empreendedores, empresas e particulares"
            maxLength={160}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pp-bio">Sobre o escritório</Label>
          <Textarea
            id="pp-bio"
            value={bio}
            onChange={(e: FormChangeEvent) => setBio(e.target.value)}
            disabled={!canEdit || saving}
            placeholder="Um parágrafo curto sobre a sua forma de trabalhar — aparece na página pública, antes da lista de serviços."
            rows={4}
            maxLength={2000}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-border/40 pt-4">
        <p className="cb-settings-panel-title text-sm">Redes sociais e contacto</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pp-instagram" className="flex items-center gap-1.5">
              <Instagram className="h-3.5 w-3.5" aria-hidden /> Instagram
            </Label>
            <Input
              id="pp-instagram"
              value={instagram}
              onChange={(e: FormChangeEvent) => setInstagram(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="https://instagram.com/…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-facebook" className="flex items-center gap-1.5">
              <Facebook className="h-3.5 w-3.5" aria-hidden /> Facebook
            </Label>
            <Input
              id="pp-facebook"
              value={facebook}
              onChange={(e: FormChangeEvent) => setFacebook(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="https://facebook.com/…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-linkedin" className="flex items-center gap-1.5">
              <Linkedin className="h-3.5 w-3.5" aria-hidden /> LinkedIn
            </Label>
            <Input
              id="pp-linkedin"
              value={linkedin}
              onChange={(e: FormChangeEvent) => setLinkedin(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="https://linkedin.com/in/…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-whatsapp" className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden /> WhatsApp
            </Label>
            <Input
              id="pp-whatsapp"
              value={whatsapp}
              onChange={(e: FormChangeEvent) => setWhatsapp(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="https://wa.me/351…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pp-website" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" aria-hidden /> Outro site
            </Label>
            <Input
              id="pp-website"
              value={website}
              onChange={(e: FormChangeEvent) => setWebsite(e.target.value)}
              disabled={!canEdit || saving}
              placeholder="https://…"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/40 pt-4">
        <p className="cb-settings-panel-title text-sm">Cores da página pública (opcional)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pp-primary-color">Cor principal</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Escolher cor principal"
                value={isValidHex(primaryColor) ? primaryColor : '#12352a'}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!canEdit || saving}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
              />
              <Input
                id="pp-primary-color"
                value={primaryColor}
                onChange={(e: FormChangeEvent) => setPrimaryColor(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="#12352a"
                className={primaryInvalid ? 'border-destructive' : undefined}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-secondary-color">Cor secundária</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Escolher cor secundária"
                value={isValidHex(secondaryColor) ? secondaryColor : '#c9a24b'}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={!canEdit || saving}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
              />
              <Input
                id="pp-secondary-color"
                value={secondaryColor}
                onChange={(e: FormChangeEvent) => setSecondaryColor(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="#c9a24b"
                className={secondaryInvalid ? 'border-destructive' : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/40 pt-4">
        <div className="flex items-center justify-between">
          <p className="cb-settings-panel-title text-sm">Perguntas frequentes</p>
          {canEdit ? (
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={addFaq}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar pergunta
            </Button>
          ) : null}
        </div>
        {faqs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
            Sem perguntas frequentes ainda — aparecem na página pública, antes do rodapé.
          </p>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="flex gap-2 rounded-lg border border-border/50 p-3">
                <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/40" aria-hidden />
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={faq.question}
                    onChange={(e: FormChangeEvent) => patchFaq(faq.id, { question: e.target.value })}
                    disabled={!canEdit || saving}
                    placeholder="Pergunta"
                    maxLength={200}
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={(e: FormChangeEvent) => patchFaq(faq.id, { answer: e.target.value })}
                    disabled={!canEdit || saving}
                    placeholder="Resposta"
                    rows={2}
                    maxLength={2000}
                  />
                </div>
                {canEdit ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={saving}
                    onClick={() => removeFaq(faq.id)}
                    aria-label="Remover pergunta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {canEdit ? (
        <Button type="button" className="cb-btn-primary" disabled={saving} onClick={() => void onSave()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar página pública
        </Button>
      ) : null}
    </section>
  )
}
