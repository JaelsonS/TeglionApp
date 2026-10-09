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
  MAYA_SETUP_SERVICE_OPTIONS_BR,
  MAYA_SETUP_SERVICE_OPTIONS_PT,
  MAYA_SETUP_SPECIALTIES,
} from '@/features/maya/setup/mayaSetupCatalog'

type Step = 'consent' | 'questions' | 'loading' | 'preview' | 'done'

function isFirmOwner(user: AuthUser | null | undefined) {
  if (!user) return false
  if (user.role === 'FIRM_OWNER' || user.role === 'PLATFORM_OWNER') return true
  if (user.firmRole === 'FIRM_OWNER') return true
  return user.permissions?.includes('firm:owner') ?? false
}

const PRIVACY_LINK = 'LEGAL_DECISION_REQUIRED'

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
  const [serviceKeys, setServiceKeys] = useState<string[]>([
    'consultoria-individual',
    'simulacao-irs',
    'abertura-atividade',
  ])
  const [irsCampaign, setIrsCampaign] = useState(true)
  const [cityRegion, setCityRegion] = useState('')
  const [previewTab, setPreviewTab] = useState<'site' | 'services' | 'irs' | 'booking'>('site')

  useEffect(() => {
    function onOpen() {
      if (!owner) {
        toast.error('Só o responsável do escritório pode usar a configuração rápida.')
        return
      }
      setStep('consent')
      setSession(null)
      setOpen(true)
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
      scheduleHint: { weekdays: [1, 2, 3, 4, 5], dayStart: '09:00', dayEnd: '18:00' },
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
      toast.success('Rascunho aplicado — revise e publique manualmente quando estiver pronto.')
    } catch {
      toast.error('Não foi possível aplicar o rascunho.')
    } finally {
      setBusy(false)
    }
  }

  const proposal = session?.proposal

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="maya-setup-wizard">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" aria-hidden />
            Configuração rápida Maya
          </DialogTitle>
          <DialogDescription>
            Questionário curto + proposta em rascunho. Não é aconselhamento fiscal; o Teglion não calcula impostos
            AT.
          </DialogDescription>
        </DialogHeader>

        {step === 'consent' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A Maya pode preparar textos genéricos para a página pública, serviços do catálogo e horários de
              agenda. Os dados do questionário são processados pela{' '}
              <strong>OpenAI</strong> como subcontratante — ver política: {PRIVACY_LINK}.
            </p>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={consent}
                onCheckedChange={(v: boolean | 'indeterminate') => setConsent(v === true)}
              />
              <span>Autorizo o processamento destes dados para gerar a proposta de configuração.</span>
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
              <Label htmlFor="maya-city">Cidade ou região (para copy)</Label>
              <input
                id="maya-city"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={cityRegion}
                onChange={(e) => setCityRegion(e.target.value)}
                placeholder="Ex.: Porto, Grande Lisboa"
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
              <Label>Serviços desejados</Label>
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('consent')}>
                Voltar
              </Button>
              <Button onClick={() => void startSession()} disabled={busy || serviceKeys.length < 1}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                A Maya prepara…
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'loading' ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm text-muted-foreground">A Maya está a preparar a proposta…</p>
          </div>
        ) : null}

        {step === 'preview' && proposal ? (
          <div className="space-y-4">
            {proposal.rationale ? (
              <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">{proposal.rationale}</p>
            ) : null}
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ['site', 'Página'],
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
            <div className="text-sm">
              {previewTab === 'site' ? (
                <pre className="max-h-48 overflow-auto rounded-md bg-muted/30 p-2 text-xs">
                  {JSON.stringify(proposal.publicSitePatch, null, 2)}
                </pre>
              ) : null}
              {previewTab === 'services' ? (
                <ul className="list-disc pl-5">
                  {proposal.services.map((s) => (
                    <li key={s.catalogKey}>{s.name || s.catalogKey}</li>
                  ))}
                </ul>
              ) : null}
              {previewTab === 'irs' ? (
                proposal.irs.activateCampaign ? (
                  <p>Activar templates: {proposal.irs.templateIds.join(', ') || '—'}</p>
                ) : (
                  <p className="text-muted-foreground">Sem campanha IRS nesta proposta.</p>
                )
              ) : null}
              {previewTab === 'booking' ? (
                <>
                  <p>Fuso: {proposal.booking.timezone}</p>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted/30 p-2 text-xs">
                    {JSON.stringify(proposal.booking.defaultSchedule, null, 2)}
                  </pre>
                </>
              ) : null}
            </div>
            <p className="text-caption text-muted-foreground">
              Nada será publicado automaticamente. Depois de aplicar, publique a página e os serviços manualmente.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('questions')}>
                Ajustar respostas
              </Button>
              <Button onClick={() => void applyDraft()} disabled={busy}>
                Aplicar rascunho
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'done' ? (
          <div className="space-y-4">
            <p className="text-sm text-success font-medium">Rascunho aplicado com sucesso.</p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link to="/app/firm/settings?tab=pagina-publica">Definições → Página pública</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/app/firm/services">Serviços</Link>
              </Button>
              {countryCode === 'PT' ? (
                <Button asChild variant="outline">
                  <Link to="/app/firm/irs">IRS</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to="/app/firm/agenda?panel=settings">Agenda</Link>
              </Button>
            </div>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
