import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { useAuthOptional } from '@/shared/hooks/useAuth'
import type { AuthUser } from '@/shared/types/auth'
import {
  mayaSetupApi,
  type MayaSetupAnswers,
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
import { formatBookingPreview, formatPublicSitePreview } from '@/features/maya/setup/mayaSetupPreview'
import {
  listProposalSectionPreviews,
  proposalThemeSwatch,
} from '@/features/maya/setup/mayaSetupPreviewVisual'
import type { MayaSetupCapabilities } from '@/infrastructure/api/contabil/mayaSetup'

import {
  MayaSetupMediaStep,
  type MayaSetupMediaState,
} from '@/features/maya/setup/MayaSetupMediaStep'

type Step = 'consent' | 'media' | 'questions' | 'loading' | 'preview' | 'done'

const DEFAULT_MEDIA: MayaSetupMediaState = {
  logoUploaded: false,
  heroImage: null,
  aboutImage: null,
  prepareServicesForPublicPage: false,
  includeDemoClients: false,
  serviceImages: {},
}

function isFirmOwner(user: AuthUser | null | undefined) {
  if (!user) return false
  if (user.role === 'FIRM_OWNER' || user.role === 'PLATFORM_OWNER') return true
  if (user.firmRole === 'FIRM_OWNER') return true
  return user.permissions?.includes('firm:owner') ?? false
}

const OWNER_BRIEF_MAX = 600

export function MayaSetupWizard() {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const owner = isFirmOwner(user)

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('consent')
  const [session, setSession] = useState<MayaSetupSession | null>(null)
  const [busy, setBusy] = useState(false)

  const [consent, setConsent] = useState(false)
  const [countryCode, setCountryCode] = useState<'PT' | 'BR'>('PT')
  const [tone, setTone] = useState<'formal' | 'friendly'>('friendly')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [serviceKeys, setServiceKeys] = useState<string[]>([])
  const [customServices, setCustomServices] = useState<Array<{ name: string; description: string }>>([])
  const [irsCampaign, setIrsCampaign] = useState(true)
  const [cityRegion, setCityRegion] = useState('')
  const [ownerBrief, setOwnerBrief] = useState('')
  const [previewTab, setPreviewTab] = useState<'site' | 'services' | 'irs' | 'booking'>('site')
  const [media, setMedia] = useState<MayaSetupMediaState>(DEFAULT_MEDIA)
  const [capabilities, setCapabilities] = useState<MayaSetupCapabilities | null>(null)

  useEffect(() => {
    function onOpen() {
      if (!owner) {
        toast.error('Só o responsável do escritório pode usar a configuração rápida.')
        return
      }
      const inlineOnPublicSite =
        typeof window !== 'undefined' &&
        window.location.pathname.includes('/app/firm/settings') &&
        window.location.search.includes('tab=pagina-publica') &&
        window.location.search.includes('mayaSetup=1')
      if (inlineOnPublicSite) return
      setStep('consent')
      setSession(null)
      setServiceKeys([])
      setCustomServices([])
      setMedia(DEFAULT_MEDIA)
      setOpen(true)
      void mayaSetupApi.getCapabilities().then((r) => setCapabilities(r.capabilities)).catch(() => setCapabilities(null))
    }
    window.addEventListener(MAYA_SETUP_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(MAYA_SETUP_OPEN_EVENT, onOpen)
  }, [owner])

  const serviceOptions = countryCode === 'BR' ? MAYA_SETUP_SERVICE_OPTIONS_BR : MAYA_SETUP_SERVICE_OPTIONS_PT

  function buildAnswers(): MayaSetupAnswers {
    return {
      consentOpenAi: true,
      consentVersion: '1',
      countryCode,
      tone,
      specialties,
      serviceCatalogKeys: serviceKeys,
      irsCampaign: countryCode === 'PT' ? irsCampaign : false,
      cityRegion: cityRegion.trim() || undefined,
      ownerBrief: ownerBrief.trim().slice(0, OWNER_BRIEF_MAX) || undefined,
      ...(customServices.filter((s) => s.name.trim()).length
        ? {
            customServices: customServices
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
      ...(media.logoUploaded ||
      media.heroImage ||
      media.aboutImage ||
      media.prepareServicesForPublicPage ||
      media.includeDemoClients ||
      Object.keys(media.serviceImages).length
        ? {
            mediaAssets: {
              ...(media.logoUploaded ? { logoUploaded: true } : {}),
              ...(media.heroImage ? { heroImage: media.heroImage } : {}),
              ...(media.aboutImage ? { aboutImage: media.aboutImage } : {}),
              ...(media.prepareServicesForPublicPage ? { prepareServicesForPublicPage: true } : {}),
              ...(media.includeDemoClients ? { includeDemoClients: true } : {}),
              ...(Object.keys(media.serviceImages).length
                ? {
                    serviceImages: Object.fromEntries(
                      Object.entries(media.serviceImages).map(([k, storageKey]) => [k, { storageKey }]),
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
      const { session: created } = await mayaSetupApi.createSession(buildAnswers())
      setSession(created)
      setStep('loading')
      const { session: generated } = await mayaSetupApi.generate(created.id)
      setSession(generated)
      setStep('preview')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Não foi possível gerar a proposta.'
      toast.error(msg)
      setStep('questions')
    } finally {
      setBusy(false)
    }
  }

  async function applyDraft() {
    if (!session) return
    setBusy(true)
    try {
      const result = await mayaSetupApi.apply(session.id)
      setSession(result.session)
      setStep('done')
      const slug = user?.tenant?.slug
      if (slug) markMayaSetupAppliedForActivation(slug)
      window.dispatchEvent(new CustomEvent(MAYA_SETUP_APPLIED_EVENT))
      toast.success('Rascunho aplicado — revise e publique manualmente quando estiver pronto.')
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" data-testid="maya-setup-wizard">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" aria-hidden />
            Configuração rápida
          </DialogTitle>
          <DialogDescription>
            A Maya prepara um rascunho da página, serviços e agenda. Não substitui aconselhamento fiscal nem cálculo
            AT.
          </DialogDescription>
        </DialogHeader>

        {step === 'consent' ? (
          <div className="space-y-4">
            <MayaSetupConsentIntro />
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={consent}
                onCheckedChange={(v: boolean | 'indeterminate') => setConsent(v === true)}
              />
              <span>
                Autorizo o envio destas respostas para gerar a proposta de configuração, nos termos indicados acima.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep('questions')} disabled={!consent}>
                Continuar
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'questions' ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="maya-brief">Conte-nos em suas palavras (opcional)</Label>
              <textarea
                id="maya-brief"
                className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed"
                value={ownerBrief}
                maxLength={OWNER_BRIEF_MAX}
                onChange={(e) => setOwnerBrief(e.target.value)}
                placeholder="Ex.: Queremos ser vistos como escritório moderno para autónomos em Coimbra; destacar IRS e e-Fatura; tom acolhedor."
              />
              <p className="text-caption text-muted-foreground">
                {ownerBrief.length}/{OWNER_BRIEF_MAX} — não inclua NIFs, nomes de clientes nem documentos.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>País do escritório</Label>
              <div className="flex gap-2">
                {(['PT', 'BR'] as const).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={countryCode === c ? 'default' : 'outline'}
                    onClick={() => {
                      setCountryCode(c)
                      if (c === 'BR') {
                        setIrsCampaign(false)
                        setServiceKeys(['consultoria-individual'])
                      }
                    }}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Tom dos textos</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={tone === 'formal' ? 'default' : 'outline'}
                  onClick={() => setTone('formal')}
                >
                  Formal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={tone === 'friendly' ? 'default' : 'outline'}
                  onClick={() => setTone('friendly')}
                >
                  Próximo
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maya-city">Cidade ou região</Label>
              <input
                id="maya-city"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={cityRegion}
                onChange={(e) => setCityRegion(e.target.value)}
                placeholder="Ex.: Coimbra, Grande Lisboa"
              />
            </div>
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
                      onClick={() =>
                        setSpecialties((prev) => (on ? prev.filter((x) => x !== s) : [...prev, s]))
                      }
                    >
                      {s}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Serviços a activar no escritório</Label>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
                {serviceOptions.map((opt) => (
                  <label key={opt.catalogKey} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={serviceKeys.includes(opt.catalogKey)}
                      onCheckedChange={(v: boolean | 'indeterminate') => {
                        setServiceKeys((prev) =>
                          v === true
                            ? [...new Set([...prev, opt.catalogKey])]
                            : prev.filter((k) => k !== opt.catalogKey),
                        )
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            {countryCode === 'PT' ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={irsCampaign}
                  onCheckedChange={(v: boolean | 'indeterminate') => setIrsCampaign(v === true)}
                />
                Incluir campanha IRS Modelo 3 (recolha — não cálculo AT)
              </label>
            ) : null}
            <div className="grid gap-2 rounded-lg border border-dashed p-3">
              <Label>Serviços personalizados (opcional)</Label>
              <p className="text-caption text-muted-foreground">
                Além do catálogo — nome à medida do escritório (preço e formulário pode afinar depois em Serviços).
              </p>
              {customServices.map((row, idx) => (
                <div key={idx} className="flex flex-col gap-1 sm:flex-row">
                  <input
                    className="h-9 flex-1 rounded-md border border-input px-2 text-sm"
                    placeholder="Nome do serviço"
                    value={row.name}
                    onChange={(e) =>
                      setCustomServices((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)),
                      )
                    }
                  />
                  <input
                    className="h-9 flex-1 rounded-md border border-input px-2 text-sm"
                    placeholder="Descrição curta (opcional)"
                    value={row.description}
                    onChange={(e) =>
                      setCustomServices((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r)),
                      )
                    }
                  />
                </div>
              ))}
              {customServices.length < 4 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomServices((prev) => [...prev, { name: '', description: '' }])}
                >
                  Adicionar serviço personalizado
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('consent')}>
                Voltar
              </Button>
              <Button
                onClick={() => setStep('media')}
                disabled={serviceKeys.length < 1 && !customServices.some((s) => s.name.trim())}
              >
                Continuar — imagens
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'media' ? (
          <MayaSetupMediaStep
            value={media}
            onChange={setMedia}
            serviceCatalogKeys={serviceKeys}
            countryCode={countryCode}
            demoOfficeAllowed={Boolean(capabilities?.demoOffice)}
            onBack={() => setStep('questions')}
            customServices={customServices.filter((s) => s.name.trim())}
            onGenerate={() => void startSession()}
            generateDisabled={serviceKeys.length < 1 && !customServices.some((s) => s.name.trim())}
            generating={busy}
          />
        ) : null}

        {step === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm text-muted-foreground">A Maya está a preparar a proposta…</p>
            <p className="text-caption text-muted-foreground">Isto pode demorar até um minuto.</p>
          </div>
        ) : null}

        {step === 'preview' && proposal ? (
          <div className="space-y-4">
            {proposal.rationale ? (
              <p className="rounded-md border border-brand/15 bg-brand/[0.04] p-3 text-sm leading-relaxed text-foreground">
                {proposal.rationale}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['site', 'Página pública'],
                  ['services', 'Serviços'],
                  ['irs', 'IRS'],
                  ['booking', 'Horários'],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={previewTab === id ? 'default' : 'outline'}
                  onClick={() => setPreviewTab(id)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm leading-relaxed">
              {previewTab === 'site' && sitePreview ? (
                sitePreview.empty ? (
                  <p className="text-muted-foreground">
                    A proposta não trouxe textos de página — ao aplicar, o sistema tentará preencher um mínimo a
                    partir do questionário. Ajuste o texto livre e regenere, ou edite depois em Definições.
                  </p>
                ) : (
                  <>
                    {themeSwatch ? (
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-caption text-muted-foreground">Cores sugeridas</span>
                        <span
                          className="h-6 w-6 rounded border border-border"
                          style={{ backgroundColor: themeSwatch.primary }}
                          title="Primária"
                        />
                        <span
                          className="h-6 w-6 rounded border border-border"
                          style={{ backgroundColor: themeSwatch.secondary }}
                          title="Secundária"
                        />
                      </div>
                    ) : null}
                    {sectionPreviews.length > 0 ? (
                      <ul className="mb-3 space-y-1 border-b border-border/50 pb-3">
                        {sectionPreviews.map((sec) => (
                          <li key={`${sec.type}-${sec.title}`} className="text-caption">
                            <span className="font-medium text-foreground">{sec.type}</span>
                            {sec.title ? ` — ${sec.title}` : ''}
                            {sec.snippet ? (
                              <span className="block text-muted-foreground">{sec.snippet}</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  <dl className="space-y-2">
                    {sitePreview.seoTitle ? (
                      <div>
                        <dt className="text-caption font-medium text-muted-foreground">Título (SEO)</dt>
                        <dd>{sitePreview.seoTitle}</dd>
                      </div>
                    ) : null}
                    {sitePreview.seoDescription ? (
                      <div>
                        <dt className="text-caption font-medium text-muted-foreground">Descrição</dt>
                        <dd>{sitePreview.seoDescription}</dd>
                      </div>
                    ) : null}
                    {sitePreview.heroTitle ? (
                      <div>
                        <dt className="text-caption font-medium text-muted-foreground">Destaque</dt>
                        <dd className="font-medium">{sitePreview.heroTitle}</dd>
                        {sitePreview.heroTagline ? <dd className="text-muted-foreground">{sitePreview.heroTagline}</dd> : null}
                        {sitePreview.heroBio ? <dd className="mt-1">{sitePreview.heroBio}</dd> : null}
                      </div>
                    ) : null}
                    {sitePreview.aboutBody ? (
                      <div>
                        <dt className="text-caption font-medium text-muted-foreground">
                          {sitePreview.aboutHeading || 'Sobre'}
                        </dt>
                        <dd className="whitespace-pre-wrap">{sitePreview.aboutBody}</dd>
                      </div>
                    ) : null}
                  </dl>
                  </>
                )
              ) : null}
              {previewTab === 'services' ? (
                <ul className="list-disc space-y-1 pl-5">
                  {proposal.services.map((s) => (
                    <li key={s.catalogKey}>
                      <span className="font-medium">{s.name || s.catalogKey}</span>
                      <span className="text-muted-foreground"> — rascunho, não publicado</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {previewTab === 'irs' ? (
                proposal.irs.activateCampaign ? (
                  <p>
                    Campanha IRS: activar{' '}
                    <strong>{proposal.irs.templateIds.join(', ') || 'modelo Modelo 3'}</strong> (revise em IRS antes
                    de publicar).
                  </p>
                ) : (
                  <p className="text-muted-foreground">Sem campanha IRS nesta proposta.</p>
                )
              ) : null}
              {previewTab === 'booking' ? (
                <ul className="space-y-1">
                  {bookingLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <p className="text-caption text-muted-foreground">
              Nada é publicado automaticamente. Depois de aplicar, publique a página e os serviços quando estiver
              satisfeito.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('questions')}>
                Ajustar e gerar de novo
              </Button>
              <Button onClick={() => void applyDraft()} disabled={busy}>
                Aplicar rascunho
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'done' ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-success">Rascunho aplicado. Falta publicar o que quiser tornar público.</p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link to="/app/firm/settings?tab=pagina-publica">Rever página pública</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/app/firm/services">Rever serviços</Link>
              </Button>
              {countryCode === 'PT' ? (
                <Button asChild variant="outline">
                  <Link to="/app/firm/irs">Área IRS</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to="/app/firm/agenda?panel=settings">Agenda</Link>
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false)
                window.dispatchEvent(new CustomEvent(ACTIVATION_ASSISTANT_OPEN_EVENT))
              }}
            >
              Continuar activação
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
