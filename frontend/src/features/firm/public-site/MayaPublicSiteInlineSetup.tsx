import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import type { FirmSettingsBundle } from '@/shared/types/firmSettings'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import {
  mayaSetupApi,
  type MayaSetupAnswers,
  type MayaSetupCapabilities,
  type MayaSetupSession,
} from '@/infrastructure/api/contabil/mayaSetup'
import { MAYA_SETUP_OPEN_EVENT } from '@/features/maya/setup/openMayaSetup'
import {
  ACTIVATION_ASSISTANT_OPEN_EVENT,
  MAYA_SETUP_APPLIED_EVENT,
} from '@/features/firm/activation/openActivationAssistant'
import { markMayaSetupAppliedForActivation } from '@/features/firm/activation/activationAssistantPrefs'
import {
  MAYA_SETUP_SERVICE_OPTIONS_BR,
  MAYA_SETUP_SERVICE_OPTIONS_PT,
  MAYA_SETUP_SPECIALTIES,
} from '@/features/maya/setup/mayaSetupCatalog'
import { MayaSetupConsentIntro } from '@/features/maya/setup/mayaSetupConsentCopy'
import {
  MayaSetupMediaStep,
  type MayaSetupMediaState,
  type MayaSetupCustomServiceRow,
} from '@/features/maya/setup/MayaSetupMediaStep'
import { MayaSetupBrandLegalStep } from '@/features/maya/setup/MayaSetupBrandLegalStep'
import { buildMayaLivePreviewDraft } from '@/features/maya/setup/mayaSetupLocalPatch'
import { formatBookingPreview, formatPublicSitePreview } from '@/features/maya/setup/mayaSetupPreview'
import {
  listProposalSectionPreviews,
  proposalThemeSwatch,
} from '@/features/maya/setup/mayaSetupPreviewVisual'
import { useAuthOptional } from '@/shared/hooks/useAuth'
import type { AuthUser } from '@/shared/types/auth'

type Step = 'consent' | 'questions' | 'brand' | 'media' | 'loading' | 'preview' | 'done'

const DEFAULT_MEDIA: MayaSetupMediaState = {
  logoUploaded: false,
  heroImage: null,
  aboutImage: null,
  prepareServicesForPublicPage: false,
  includeDemoClients: false,
  serviceImages: {},
}

const OWNER_BRIEF_MAX = 600

function isFirmOwner(user: AuthUser | null | undefined) {
  if (!user) return false
  if (user.role === 'FIRM_OWNER' || user.role === 'PLATFORM_OWNER') return true
  if (user.firmRole === 'FIRM_OWNER') return true
  return user.permissions?.includes('firm:owner') ?? false
}

type Props = {
  bundle: FirmSettingsBundle
  baseDraft: PublicSiteConfig
  onLivePreviewDraft: (draft: PublicSiteConfig | null) => void
  onMediaUploaded: () => void
  onOpenSectionByType: (type: PublicSiteConfig['sections'][number]['type']) => void
  onPreviewNewTab: () => Promise<void>
  previewingNewTab: boolean
  onSaveLiveDraft: (config: PublicSiteConfig) => Promise<void>
}

export function MayaPublicSiteInlineSetup({
  bundle,
  baseDraft,
  onLivePreviewDraft,
  onMediaUploaded,
  onOpenSectionByType,
  onPreviewNewTab,
  previewingNewTab,
  onSaveLiveDraft,
}: Props) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const owner = isFirmOwner(user)
  const firmName = bundle.publicProfile.displayName || bundle.firm.name || 'O seu escritório'

  const [expanded, setExpanded] = useState(true)
  const [step, setStep] = useState<Step>('consent')
  const [session, setSession] = useState<MayaSetupSession | null>(null)
  const [busy, setBusy] = useState(false)
  const [capabilities, setCapabilities] = useState<MayaSetupCapabilities | null>(null)

  const [consent, setConsent] = useState(false)
  const [countryCode, setCountryCode] = useState<'PT' | 'BR'>('PT')
  const [tone, setTone] = useState<'formal' | 'friendly'>('friendly')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [serviceKeys, setServiceKeys] = useState<string[]>([])
  const [customServices, setCustomServices] = useState<MayaSetupCustomServiceRow[]>([])
  const [irsCampaign, setIrsCampaign] = useState(true)
  const [cityRegion, setCityRegion] = useState('')
  const [ownerBrief, setOwnerBrief] = useState('')
  const [media, setMedia] = useState<MayaSetupMediaState>(DEFAULT_MEDIA)
  const [overlayDraft, setOverlayDraft] = useState<PublicSiteConfig>(() => structuredClone(baseDraft))
  const [previewTab, setPreviewTab] = useState<'site' | 'services' | 'irs' | 'booking'>('site')

  useEffect(() => {
    setOverlayDraft(structuredClone(baseDraft))
  }, [baseDraft])

  useEffect(() => {
    void mayaSetupApi.getCapabilities().then((r) => setCapabilities(r.capabilities)).catch(() => setCapabilities(null))
  }, [])

  useEffect(() => {
    function onOpen() {
      if (!owner) {
        toast.error('Só o responsável do escritório pode usar a configuração rápida.')
        return
      }
      setExpanded(true)
      setStep((s) => (s === 'done' ? 'consent' : s))
      document.getElementById('maya-inline-setup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener(MAYA_SETUP_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(MAYA_SETUP_OPEN_EVENT, onOpen)
  }, [owner])

  const answers = useMemo((): MayaSetupAnswers | null => {
    if (step === 'consent') return null
    return buildAnswersFromState({
      countryCode,
      tone,
      specialties,
      serviceKeys,
      customServices,
      irsCampaign,
      cityRegion,
      ownerBrief,
      media,
    })
  }, [step, countryCode, tone, specialties, serviceKeys, customServices, irsCampaign, cityRegion, ownerBrief, media])

  const liveDraft = useMemo(() => {
    if (!expanded || step === 'consent') {
      return null
    }
    return buildMayaLivePreviewDraft({
      baseDraft,
      firmName,
      answers,
      media,
      proposal: session?.proposal ?? null,
      overlayDraft: step === 'brand' || step === 'media' || step === 'loading' || step === 'preview' ? overlayDraft : null,
    })
  }, [expanded, step, baseDraft, firmName, answers, media, session?.proposal, overlayDraft])

  useEffect(() => {
    onLivePreviewDraft(liveDraft)
    return () => onLivePreviewDraft(null)
  }, [liveDraft, onLivePreviewDraft])

  const serviceOptions = countryCode === 'BR' ? MAYA_SETUP_SERVICE_OPTIONS_BR : MAYA_SETUP_SERVICE_OPTIONS_PT
  const hasServices = serviceKeys.length > 0 || customServices.some((s) => s.name.trim())

  function buildAnswersFromState(state: {
    countryCode: 'PT' | 'BR'
    tone: 'formal' | 'friendly'
    specialties: string[]
    serviceKeys: string[]
    customServices: MayaSetupCustomServiceRow[]
    irsCampaign: boolean
    cityRegion: string
    ownerBrief: string
    media: MayaSetupMediaState
  }): MayaSetupAnswers {
    return {
      consentOpenAi: true,
      consentVersion: '1',
      countryCode: state.countryCode,
      tone: state.tone,
      specialties: state.specialties,
      serviceCatalogKeys: state.serviceKeys,
      irsCampaign: state.countryCode === 'PT' ? state.irsCampaign : false,
      cityRegion: state.cityRegion.trim() || undefined,
      ownerBrief: state.ownerBrief.trim().slice(0, OWNER_BRIEF_MAX) || undefined,
      ...(state.customServices.filter((s) => s.name.trim()).length
        ? {
            customServices: state.customServices
              .filter((s) => s.name.trim())
              .map((s) => ({
                name: s.name.trim(),
                description: s.description.trim() || undefined,
                durationMinutes: 60,
                priceCents: 0,
              })),
          }
        : {}),
      scheduleHint: { weekdays: [1, 2, 3, 4, 5], dayStart: '09:00', dayEnd: '18:00' },
      ...(state.media.logoUploaded ||
      state.media.heroImage ||
      state.media.aboutImage ||
      state.media.prepareServicesForPublicPage ||
      state.media.includeDemoClients ||
      Object.keys(state.media.serviceImages).length
        ? {
            mediaAssets: {
              ...(state.media.logoUploaded ? { logoUploaded: true } : {}),
              ...(state.media.heroImage ? { heroImage: state.media.heroImage } : {}),
              ...(state.media.aboutImage ? { aboutImage: state.media.aboutImage } : {}),
              ...(state.media.prepareServicesForPublicPage ? { prepareServicesForPublicPage: true } : {}),
              ...(state.media.includeDemoClients ? { includeDemoClients: true } : {}),
              ...(Object.keys(state.media.serviceImages).length
                ? {
                    serviceImages: Object.fromEntries(
                      Object.entries(state.media.serviceImages).map(([k, storageKey]) => [k, { storageKey }]),
                    ),
                  }
                : {}),
            },
          }
        : {}),
    }
  }

  async function startSession() {
    if (!consent) {
      toast.error('Confirme o consentimento para continuar.')
      return
    }
    setBusy(true)
    try {
      const payload = buildAnswersFromState({
        countryCode,
        tone,
        specialties,
        serviceKeys,
        customServices,
        irsCampaign,
        cityRegion,
        ownerBrief,
        media,
      })
      const { session: created } = await mayaSetupApi.createSession(payload)
      setSession(created)
      setStep('loading')
      const { session: generated } = await mayaSetupApi.generate(created.id)
      setSession(generated)
      setStep('preview')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível gerar a proposta.'
      toast.error(msg)
      setStep('media')
    } finally {
      setBusy(false)
    }
  }

  async function applyDraft() {
    if (!session) return
    setBusy(true)
    try {
      const snapshot = buildMayaLivePreviewDraft({
        baseDraft,
        firmName,
        answers: buildAnswersFromState({
          countryCode,
          tone,
          specialties,
          serviceKeys,
          customServices,
          irsCampaign,
          cityRegion,
          ownerBrief,
          media,
        }),
        media,
        proposal: session.proposal ?? null,
        overlayDraft,
      })
      await onSaveLiveDraft(snapshot)
      const result = await mayaSetupApi.apply(session.id)
      await onSaveLiveDraft(snapshot)
      setSession(result.session)
      setStep('done')
      const slug = user?.tenant?.slug
      if (slug) markMayaSetupAppliedForActivation(slug)
      window.dispatchEvent(new CustomEvent(MAYA_SETUP_APPLIED_EVENT))
      toast.success('Rascunho aplicado — pode publicar quando estiver pronto.')
      onMediaUploaded()
    } catch {
      toast.error('Não foi possível aplicar o rascunho.')
    } finally {
      setBusy(false)
    }
  }

  const proposal = session?.proposal
  const sitePreview = proposal ? formatPublicSitePreview(proposal) : null
  const bookingLines = proposal ? formatBookingPreview(proposal) : []
  const sectionPreviews = proposal ? listProposalSectionPreviews(proposal) : []
  const themeSwatch = proposal ? proposalThemeSwatch(proposal) : null

  if (!owner) return null

  return (
    <section
      id="maya-inline-setup"
      className="rounded-xl border border-brand/30 bg-card p-4 shadow-sm"
      data-testid="maya-public-site-inline-setup"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wide text-brand">
            <Sparkles className="h-4 w-4" aria-hidden />
            Configuração rápida (Maya)
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Questionário aqui — preview ao vivo à direita. Uma geração IA por sessão; edite secções, enquadre imagens e
            use telemóvel/tablet/desktop ou{' '}
            <span className="font-medium text-foreground">nova aba</span> antes de publicar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={previewingNewTab}
            onClick={() => void onPreviewNewTab()}
          >
            {previewingNewTab ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Pré-visualizar numa aba
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Recolher' : 'Expandir'}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
          {step === 'consent' ? (
            <div className="space-y-4">
              <MayaSetupConsentIntro />
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={consent} onCheckedChange={(v: boolean | 'indeterminate') => setConsent(v === true)} />
                <span>Autorizo o envio destas respostas para gerar textos via OpenAI, nos termos acima.</span>
              </label>
              <div className="flex justify-end">
                <Button onClick={() => setStep('questions')} disabled={!consent}>
                  Começar questionário
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'questions' ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="maya-brief-inline">Conte-nos em suas palavras (opcional)</Label>
                <textarea
                  id="maya-brief-inline"
                  className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={ownerBrief}
                  maxLength={OWNER_BRIEF_MAX}
                  onChange={(e) => setOwnerBrief(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {(['PT', 'BR'] as const).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={countryCode === c ? 'default' : 'outline'}
                    onClick={() => {
                      setCountryCode(c)
                      if (c === 'BR') setIrsCampaign(false)
                    }}
                  >
                    {c}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={tone === 'formal' ? 'default' : 'outline'} onClick={() => setTone('formal')}>
                  Formal
                </Button>
                <Button size="sm" variant={tone === 'friendly' ? 'default' : 'outline'} onClick={() => setTone('friendly')}>
                  Próximo
                </Button>
              </div>
              <InputLikeCity value={cityRegion} onChange={setCityRegion} />
              <SpecialtiesBlock specialties={specialties} setSpecialties={setSpecialties} />
              <CatalogServicesBlock
                serviceOptions={serviceOptions}
                serviceKeys={serviceKeys}
                setServiceKeys={setServiceKeys}
              />
              {countryCode === 'PT' ? (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={irsCampaign} onCheckedChange={(v: boolean | 'indeterminate') => setIrsCampaign(v === true)} />
                  Campanha IRS Modelo 3 (recolha)
                </label>
              ) : null}
              <CustomServicesBlock customServices={customServices} setCustomServices={setCustomServices} />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep('consent')}>
                  Voltar
                </Button>
                <Button onClick={() => setStep('brand')} disabled={!hasServices}>
                  Continuar — marca e legal
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'brand' ? (
            <MayaSetupBrandLegalStep
              overlayDraft={overlayDraft}
              onOverlayChange={setOverlayDraft}
              bundle={bundle}
              onBack={() => setStep('questions')}
              onContinue={() => setStep('media')}
              onOpenContactSection={() => onOpenSectionByType('contact')}
              onOpenFooterSection={() => onOpenSectionByType('footer')}
            />
          ) : null}

          {step === 'media' ? (
            <MayaSetupMediaStep
              value={media}
              onChange={setMedia}
              serviceCatalogKeys={serviceKeys}
              customServices={customServices.filter((s) => s.name.trim())}
              countryCode={countryCode}
              demoOfficeAllowed={Boolean(capabilities?.demoOffice)}
              onBack={() => setStep('brand')}
              onGenerate={() => void startSession()}
              generateDisabled={!hasServices}
              generating={busy}
              onAfterUpload={() => onMediaUploaded()}
              onOpenHeroSection={() => onOpenSectionByType('hero')}
              onOpenAboutSection={() => onOpenSectionByType('about')}
            />
          ) : null}

          {step === 'loading' ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-sm text-muted-foreground">A gerar textos (uma chamada IA)…</p>
            </div>
          ) : null}

          {step === 'preview' && proposal ? (
            <ProposalReview
              proposal={proposal}
              previewTab={previewTab}
              setPreviewTab={setPreviewTab}
              sitePreview={sitePreview}
              sectionPreviews={sectionPreviews}
              themeSwatch={themeSwatch ?? undefined}
              bookingLines={bookingLines}
              busy={busy}
              onBack={() => setStep('media')}
              onApply={() => void applyDraft()}
            />
          ) : null}

          {step === 'done' ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-success">Rascunho aplicado. Revise secções ou publique quando quiser.</p>
              <Button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent(ACTIVATION_ASSISTANT_OPEN_EVENT))}
              >
                Continuar activação
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function InputLikeCity({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="maya-city-inline">Cidade ou região</Label>
      <input
        id="maya-city-inline"
        className="flex h-9 w-full rounded-md border border-input px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex.: Coimbra"
      />
    </div>
  )
}

function SpecialtiesBlock({
  specialties,
  setSpecialties,
}: {
  specialties: string[]
  setSpecialties: Dispatch<SetStateAction<string[]>>
}) {
  return (
    <div className="grid gap-2">
      <Label>Especialidades</Label>
      <div className="flex flex-wrap gap-2">
        {MAYA_SETUP_SPECIALTIES.map((s) => {
          const on = specialties.includes(s)
          return (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={on ? 'default' : 'outline'}
              onClick={() => setSpecialties((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))}
            >
              {s}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function CatalogServicesBlock({
  serviceOptions,
  serviceKeys,
  setServiceKeys,
}: {
  serviceOptions: ReadonlyArray<{ readonly catalogKey: string; readonly label: string }>
  serviceKeys: string[]
  setServiceKeys: Dispatch<SetStateAction<string[]>>
}) {
  return (
    <div className="grid gap-2">
      <Label>Serviços do catálogo</Label>
      <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-2">
        {serviceOptions.map((opt) => (
          <label key={opt.catalogKey} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={serviceKeys.includes(opt.catalogKey)}
              onCheckedChange={(v: boolean | 'indeterminate') =>
                setServiceKeys((prev) =>
                  v === true ? [...new Set([...prev, opt.catalogKey])] : prev.filter((k) => k !== opt.catalogKey),
                )
              }
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function CustomServicesBlock({
  customServices,
  setCustomServices,
}: {
  customServices: MayaSetupCustomServiceRow[]
  setCustomServices: Dispatch<SetStateAction<MayaSetupCustomServiceRow[]>>
}) {
  return (
    <div className="grid gap-2 rounded-lg border border-dashed p-3">
      <Label>Serviços personalizados (opcional)</Label>
      {customServices.map((row, idx) => (
        <div key={idx} className="flex flex-col gap-1 sm:flex-row">
          <input
            className="h-9 flex-1 rounded-md border px-2 text-sm"
            placeholder="Nome"
            value={row.name}
            onChange={(e) =>
              setCustomServices((prev) => prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))
            }
          />
          <input
            className="h-9 flex-1 rounded-md border px-2 text-sm"
            placeholder="Descrição curta"
            value={row.description}
            onChange={(e) =>
              setCustomServices((prev) => prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r)))
            }
          />
        </div>
      ))}
      {customServices.length < 4 ? (
        <Button type="button" size="sm" variant="outline" onClick={() => setCustomServices((p) => [...p, { name: '', description: '' }])}>
          Adicionar serviço personalizado
        </Button>
      ) : null}
    </div>
  )
}

function ProposalReview({
  proposal,
  previewTab,
  setPreviewTab,
  sitePreview,
  sectionPreviews,
  themeSwatch,
  bookingLines,
  busy,
  onBack,
  onApply,
}: {
  proposal: NonNullable<MayaSetupSession['proposal']>
  previewTab: 'site' | 'services' | 'irs' | 'booking'
  setPreviewTab: (t: 'site' | 'services' | 'irs' | 'booking') => void
  sitePreview: ReturnType<typeof formatPublicSitePreview> | null
  sectionPreviews: ReturnType<typeof listProposalSectionPreviews>
  themeSwatch?: ReturnType<typeof proposalThemeSwatch>
  bookingLines: string[]
  busy: boolean
  onBack: () => void
  onApply: () => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Revise o resumo — o preview à direita já reflecte a proposta. «Aplicar» grava serviços e rascunho no servidor.
      </p>
      <div className="flex flex-wrap gap-1">
        {(
          [
            ['site', 'Página'],
            ['services', 'Serviços'],
            ['irs', 'IRS'],
            ['booking', 'Horários'],
          ] as const
        ).map(([id, label]) => (
          <Button key={id} size="sm" variant={previewTab === id ? 'default' : 'outline'} onClick={() => setPreviewTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="rounded-lg border bg-muted/20 p-3 text-sm">
        {previewTab === 'site' && sitePreview && !sitePreview.empty ? (
          <p className="text-muted-foreground">{sitePreview.heroTitle || sitePreview.seoTitle}</p>
        ) : null}
        {previewTab === 'services' ? (
          <ul className="list-disc pl-5">
            {proposal.services.map((s) => (
              <li key={s.catalogKey}>{s.name || s.catalogKey}</li>
            ))}
          </ul>
        ) : null}
        {previewTab === 'booking' ? (
          <ul>
            {bookingLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>
          Ajustar
        </Button>
        <Button onClick={onApply} disabled={busy}>
          Aplicar rascunho
        </Button>
      </div>
    </div>
  )
}
