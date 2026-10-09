import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Chip } from '@/shared/design-system/Chip'
import { SafeImage } from '@/shared/components/ui/SafeImage'
import { useAuthOptional } from '@/shared/hooks/useAuth'
import { cn } from '@/shared/lib/utils'
import type { AuthUser } from '@/shared/types/auth'
import {
  getMayaIntent,
  MAYA_CATALOG_INTENT_IDS,
  MAYA_CLIENT_CATALOG_INTENT_IDS,
  MAYA_LANDING_CATALOG_INTENT_IDS,
} from '@/features/maya/mayaContent'
import { resolveMayaPage } from '@/features/maya/content/resolvePage'
import type { MayaFieldHelp, MayaIntent, MayaPageGuide, MayaProblem } from '@/features/maya/content/types'
import { MAYA_OPEN_EVENT, type MayaOpenDetail } from '@/features/maya/openMaya'
import { openActivationAssistant } from '@/features/firm/activation/openActivationAssistant'
import { openMayaSetupWizard } from '@/features/maya/setup/openMayaSetup'
import {
  isMayaFabVisible,
  MAYA_FAB_CHANGED_EVENT,
  setMayaFabVisible,
} from '@/features/maya/mayaFabPreference'
import {
  MAYA_PUBLIC_SITE_COACH_EVENT,
  type PublicSiteCoachSnapshot,
} from '@/features/firm/public-site/publicSiteCoachContext'
import { MayaPublicSiteCopilotChat } from '@/features/firm/public-site/MayaPublicSiteCopilotChat'
import { mayaSetupApi } from '@/infrastructure/api/contabil/mayaSetup'

type MayaAssistantProps = {
  className?: string
  /** Landing comercial (sem login). */
  surface?: 'auto' | 'landing'
}

type MayaView =
  | { kind: 'home' }
  | { kind: 'catalog' }
  | { kind: 'intent'; id: string }
  | { kind: 'field'; intentId: string; fieldId: string }
  | { kind: 'problem'; intentId: string; problemId: string }

function isFirmResponsible(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.role === 'FIRM_OWNER' || user.role === 'PLATFORM_OWNER') return true
  if (user.firmRole === 'FIRM_OWNER') return true
  return user.permissions.includes('firm:owner')
}

function currentView(stack: MayaView[]): MayaView {
  return stack[stack.length - 1] ?? { kind: 'home' }
}

/**
 * Maya — assistente guiada (popup centrado).
 * Sem LLM · sem APIs de negócio · sem acesso a documentos/clientes/tokens.
 */
export function MayaAssistant({ className, surface = 'auto' }: MayaAssistantProps) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const navigate = useNavigate()
  const location = useLocation()
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [stack, setStack] = useState<MayaView[]>([])
  const [fabVisible, setFabVisible] = useState(true)
  const [publicSiteCoach, setPublicSiteCoach] = useState<PublicSiteCoachSnapshot | null>(null)
  const pageRef = useRef<MayaPageGuide | null>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const isLandingSurface = surface === 'landing'

  const page = resolveMayaPage(location.pathname, new URLSearchParams(location.search))
  pageRef.current = page
  const pageId = page?.id ?? null
  const prevPageIdRef = useRef<string | null>(null)

  const firstName = String(user?.fullName || '')
    .trim()
    .split(/\s+/)[0]
  const responsible = isFirmResponsible(user)
  const view = currentView(stack)

  const activeIntent: MayaIntent | null =
    view.kind === 'intent' || view.kind === 'field' || view.kind === 'problem'
      ? getMayaIntent(view.kind === 'intent' ? view.id : view.intentId) ?? null
      : null

  const activeField: MayaFieldHelp | null =
    view.kind === 'field' && activeIntent
      ? activeIntent.fields?.find((field) => field.id === view.fieldId) ?? null
      : null

  const activeProblem: MayaProblem | null =
    view.kind === 'problem' && activeIntent
      ? activeIntent.commonProblems?.find((problem) => problem.id === view.problemId) ?? null
      : null

  const isPublicSiteEditorPage = page?.id === 'settings-public'

  const capabilitiesQuery = useQuery({
    queryKey: ['maya-setup-capabilities'],
    queryFn: () => mayaSetupApi.getCapabilities().then((r) => r.capabilities),
    enabled: isPublicSiteEditorPage && Boolean(user),
    staleTime: 60_000,
  })

  useEffect(() => {
    function onCoach(ev: Event) {
      const detail = (ev as CustomEvent<PublicSiteCoachSnapshot>).detail
      if (detail?.tip) setPublicSiteCoach(detail)
    }
    window.addEventListener(MAYA_PUBLIC_SITE_COACH_EVENT, onCoach as EventListener)
    return () => window.removeEventListener(MAYA_PUBLIC_SITE_COACH_EVENT, onCoach as EventListener)
  }, [])

  useEffect(() => {
    setFabVisible(isMayaFabVisible())
    function onFabChanged(ev: Event) {
      const detail = (ev as CustomEvent<{ visible: boolean }>).detail
      if (typeof detail?.visible === 'boolean') setFabVisible(detail.visible)
      else setFabVisible(isMayaFabVisible())
    }
    window.addEventListener(MAYA_FAB_CHANGED_EVENT, onFabChanged as EventListener)
    return () => window.removeEventListener(MAYA_FAB_CHANGED_EVENT, onFabChanged as EventListener)
  }, [])

  useEffect(() => {
    function onOpen(ev: Event) {
      const detail = (ev as CustomEvent<MayaOpenDetail>).detail
      const intentId = detail?.intentId || null
      const currentPage = pageRef.current
      setOpen(true)
      if (intentId && intentId !== currentPage?.primaryIntentId && getMayaIntent(intentId)) {
        setStack([{ kind: 'intent', id: intentId }])
      } else {
        setStack([])
      }
    }
    window.addEventListener(MAYA_OPEN_EVENT, onOpen as EventListener)
    return () => window.removeEventListener(MAYA_OPEN_EVENT, onOpen as EventListener)
  }, [])

  useEffect(() => {
    if (!open) {
      prevPageIdRef.current = pageId
      return
    }
    if (prevPageIdRef.current && prevPageIdRef.current !== pageId) {
      setStack([])
    }
    prevPageIdRef.current = pageId
  }, [open, pageId])

  useLayoutEffect(() => {
    if (!open) return
    const el = bodyScrollRef.current
    if (!el) return
    el.scrollTop = 0
  }, [open, stack])

  if (!isLandingSurface && !user) return null

  const isClientSurface = !isLandingSurface && user?.role === 'CLIENT'

  function closeDialog() {
    setOpen(false)
    setStack([])
  }

  function hideFab() {
    setMayaFabVisible(false)
    setFabVisible(false)
  }

  function showFab() {
    setMayaFabVisible(true)
    setFabVisible(true)
  }

  function goHome() {
    setStack([])
  }

  function goBack() {
    setStack((prev) => prev.slice(0, -1))
  }

  function openIntent(id: string, push: boolean) {
    const next: MayaView = { kind: 'intent', id }
    setStack((prev) => (push && prev.length ? [...prev, next] : [next]))
  }

  function openField(intentId: string, fieldId: string) {
    setStack((prev) => [...prev, { kind: 'field', intentId, fieldId }])
  }

  function openProblem(intentId: string, problemId: string) {
    setStack((prev) => [...prev, { kind: 'problem', intentId, problemId }])
  }

  function goToLink(path: string) {
    closeDialog()
    if (/^https?:\/\//i.test(path)) {
      window.open(path, '_blank', 'noopener,noreferrer')
      return
    }
    const hashIndex = path.indexOf('#')
    if (hashIndex >= 0) {
      const pathname = path.slice(0, hashIndex) || location.pathname
      const hash = path.slice(hashIndex + 1)
      if (pathname === location.pathname || pathname === '') {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    navigate(path)
  }

  const showBack = stack.length > 0
  const subtitle =
    view.kind === 'catalog'
      ? isLandingSurface
        ? 'O Teglion, com calma'
        : isClientSurface
          ? 'Ajuda deste portal'
          : 'Outras áreas do Teglion'
      : view.kind === 'field' && activeField
        ? activeField.name
        : view.kind === 'problem' && activeProblem
          ? activeProblem.title
          : activeIntent
            ? activeIntent.title
            : page
              ? page.where
              : isLandingSurface
                ? 'Posso ajudar a conhecer o Teglion'
                : 'Assistente Teglion'

  const topicIds =
    page?.topicIds ??
    (isLandingSurface
      ? [...MAYA_LANDING_CATALOG_INTENT_IDS]
      : isClientSurface
        ? ['portal-home', 'portal-maya', 'portal-firm-contact']
        : ['tour', 'human-support'])
  const homeIntentsRaw = topicIds.map((id) => getMayaIntent(id)).filter((intent): intent is MayaIntent => Boolean(intent))
  const homeIntents =
    !isLandingSurface && !isClientSurface ? homeIntentsRaw.slice(0, 4) : homeIntentsRaw
  const catalogIntents = (
    isLandingSurface
      ? MAYA_LANDING_CATALOG_INTENT_IDS
      : isClientSurface
        ? MAYA_CLIENT_CATALOG_INTENT_IDS
        : MAYA_CATALOG_INTENT_IDS
  )
    .map((id) => getMayaIntent(id))
    .filter((intent): intent is MayaIntent => Boolean(intent))

  const fabPosition = cn(
    'fixed z-40',
    isLandingSurface
      ? 'bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))]'
      : 'bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] md:bottom-6 md:right-6',
  )

  return (
    <>
      {fabVisible ? (
        <div className={cn(fabPosition, 'group', className)} data-testid="maya-fab">
          {isPublicSiteEditorPage ? (
            <div
              className={cn(
                'pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden w-[min(16rem,70vw)]',
                'rounded-lg border border-brand/20 bg-card px-3 py-2 text-left shadow-md',
                'group-hover:block group-focus-within:block',
              )}
              role="tooltip"
            >
              <p className="text-[11px] font-medium text-foreground">Maya — página pública</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                {publicSiteCoach?.tip ||
                  'Passe o rato e clique — explico o passo actual e respondo dúvidas.'}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            className={cn(
              'flex h-12 w-12 items-center justify-center overflow-hidden rounded-full',
              'border border-brand/25 bg-card shadow-[var(--cb-shadow-elevated)]',
              'ring-2 ring-brand/10',
              'transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
            )}
            aria-label={
              isLandingSurface
                ? 'Abrir Maya, assistente do Teglion'
                : 'Abrir Maya, assistente virtual do Teglion'
            }
            aria-haspopup="dialog"
            aria-expanded={open}
            title="Maya — assistente Teglion"
            onClick={() => {
              setStack([])
              setOpen(true)
            }}
          >
            <SafeImage src="/maya/maya-avatar-sm.png" alt="" className="h-full w-full object-cover" />
          </button>
          <button
            type="button"
            className={cn(
              'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full',
              'border border-border/80 bg-card text-muted-foreground shadow-sm',
              'opacity-80 transition hover:opacity-100 hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
            aria-label="Esconder Maya"
            title="Esconder Maya"
            data-testid="maya-fab-dismiss"
            onClick={(e) => {
              e.stopPropagation()
              hideFab()
            }}
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            fabPosition,
            'flex h-9 items-center gap-1 rounded-full border border-border/70 bg-card/95 px-2.5',
            'text-xs text-muted-foreground shadow-sm backdrop-blur-sm',
            'transition hover:border-brand/30 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            className,
          )}
          aria-label="Mostrar Maya"
          title="Mostrar Maya"
          data-testid="maya-fab-restore"
          onClick={showFab}
        >
          <span className="font-bold text-brand" aria-hidden>
            ?
          </span>
          <SafeImage
            src="/maya/maya-avatar-sm.png"
            alt=""
            className="h-4 w-4 rounded-full object-cover opacity-90"
          />
        </button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next: boolean) => {
          setOpen(next)
          if (!next) setStack([])
        }}
      >
        <DialogContent
          className={cn(
            'gap-0 overflow-hidden p-0 sm:max-w-md',
            'border-brand/20 shadow-[var(--cb-shadow-elevated)]',
          )}
          aria-labelledby={titleId}
        >
          <div className="relative overflow-hidden border-b border-brand/10 bg-gradient-to-br from-brand/[0.12] via-sky-500/[0.06] to-transparent px-5 pb-5 pt-6 pr-12">
            {showBack ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute left-3 top-3 h-8 w-8"
                aria-label="Voltar"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}

            <div className={cn('flex flex-col items-center text-center', showBack && 'pt-2')}>
              <div
                className={cn(
                  'overflow-hidden rounded-full bg-card shadow-md',
                  'ring-2 ring-brand/30 ring-offset-2 ring-offset-background',
                  showBack ? 'h-16 w-16' : 'h-24 w-24 sm:h-28 sm:w-28',
                )}
              >
                <SafeImage
                  src="/maya/maya-avatar.png"
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <DialogTitle id={titleId} className="mt-3 text-lg font-semibold tracking-tight">
                Maya
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                {subtitle}
              </DialogDescription>
            </div>
          </div>

          <div
            ref={bodyScrollRef}
            className="max-h-[min(58dvh,480px)] space-y-4 overflow-y-auto overscroll-y-contain px-5 py-4"
          >
            {view.kind === 'home' ? (
              <MayaHome
                firstName={firstName}
                page={page}
                intents={homeIntents}
                catalogLabel={
                  isLandingSurface
                    ? 'Mais sobre o Teglion'
                    : isClientSurface
                      ? 'Mais ajuda neste portal'
                      : 'Mais temas (mapa completo)'
                }
                isLandingSurface={isLandingSurface}
                isFirmSurface={!isLandingSurface && !isClientSurface}
                responsible={responsible}
                onOpenIntent={(id) => openIntent(id, false)}
                onOpenCatalog={() => setStack([{ kind: 'catalog' }])}
                onQuickSetup={() => {
                  openMayaSetupWizard()
                  setOpen(false)
                }}
              />
            ) : null}

            {view.kind === 'catalog' ? (
              <MayaCatalog
                intents={catalogIntents}
                isClientSurface={isClientSurface}
                isLandingSurface={isLandingSurface}
                onOpenIntent={(id) => openIntent(id, true)}
              />
            ) : null}

            {view.kind === 'intent' && activeIntent ? (
              <MayaIntentView
                intent={activeIntent}
                responsible={responsible}
                onOpenIntent={(id) => openIntent(id, true)}
                onOpenField={(fieldId) => openField(activeIntent.id, fieldId)}
                onOpenProblem={(problemId) => openProblem(activeIntent.id, problemId)}
                onGoToLink={goToLink}
                onHome={goHome}
              />
            ) : null}

            {view.kind === 'field' && activeIntent && activeField ? (
              <MayaFieldView
                field={activeField}
                parentTitle={activeIntent.title}
                onBack={goBack}
              />
            ) : null}

            {view.kind === 'problem' && activeIntent && activeProblem ? (
              <MayaProblemView problem={activeProblem} onBack={goBack} />
            ) : null}

            {isPublicSiteEditorPage && responsible ? (
              <div className="border-t border-border/40 pt-3">
                <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                  Dúvida rápida sobre esta página?
                </p>
                <MayaPublicSiteCopilotChat
                  embedded
                  setupStep="public-site-coach"
                  countryCode="PT"
                  aiAdviseEnabled={capabilitiesQuery.data?.aiSetup === true}
                />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MayaTopicRow({ intent, onSelect }: { intent: MayaIntent; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-left',
        'transition hover:border-brand/30 hover:bg-brand/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      )}
      onClick={onSelect}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug text-foreground">{intent.title}</span>
        {intent.shortDescription ? (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {intent.shortDescription}
          </span>
        ) : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

function MayaBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-end gap-2.5">
      <SafeImage
        src="/maya/maya-avatar-sm.png"
        alt=""
        className="mb-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-brand/20"
      />
      <div
        className={cn(
          'min-w-0 flex-1 rounded-2xl rounded-bl-md border border-brand/15',
          'bg-muted/40 px-3.5 py-3 text-sm leading-relaxed text-foreground',
          'shadow-sm',
        )}
      >
        {children}
      </div>
    </div>
  )
}

function MayaHome({
  firstName,
  page,
  intents,
  catalogLabel,
  isLandingSurface,
  isFirmSurface,
  responsible,
  onOpenIntent,
  onOpenCatalog,
  onQuickSetup,
}: {
  firstName: string
  page: MayaPageGuide | null
  intents: MayaIntent[]
  catalogLabel: string
  isLandingSurface?: boolean
  isFirmSurface?: boolean
  responsible?: boolean
  onOpenIntent: (id: string) => void
  onOpenCatalog: () => void
  onQuickSetup?: () => void
}) {
  return (
    <div data-testid="maya-home">
      <MayaBubble>
        {isLandingSurface ? (
          <>
            <p>
              Olá{firstName ? `, ${firstName}` : ''}! Eu sou a Maya. O Teglion é a plataforma para
              escritórios de contabilidade em Portugal — um produto da AfDigital — Soluções Tecnológicas.
            </p>
            <p className="mt-2">
              {page?.summary ||
                'Explico o produto, o trial de 14 dias, a página pública e o portal. Evoluímos o sistema todos os dias.'}
            </p>
            {page?.firstTimeHint ? (
              <p className="mt-2 text-muted-foreground">{page.firstTimeHint}</p>
            ) : null}
            <p className="mt-2 text-caption text-muted-foreground">
              Se preferir uma pessoa, escolha «Falar com uma pessoa» — abro o WhatsApp.
            </p>
          </>
        ) : (
          <>
            <p>
              Olá{firstName ? `, ${firstName}` : ''}! Eu sou a Maya.
              {page ? (
                <>
                  {' '}
                  Está na <span className="font-medium text-foreground">{page.where}</span>.
                </>
              ) : (
                <> Sou a assistente do Teglion.</>
              )}
            </p>
            {page ? (
              <>
                <p className="mt-2">{page.summary}</p>
                {page.firstTimeHint ? (
                  <p className="mt-2 text-muted-foreground">{page.firstTimeHint}</p>
                ) : null}
                {page.emptyHint ? (
                  <p className="mt-2 text-muted-foreground">{page.emptyHint}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-muted-foreground">
                {isFirmSurface
                  ? 'Comece pelo que importa neste ecrã — ou use a configuração rápida se for o responsável do escritório.'
                  : 'Escolha um tema abaixo — explico passo a passo e abro a página certa quando quiser.'}
              </p>
            )}
            <p className="mt-2 text-caption text-muted-foreground">
              Guia do produto — não vejo documentos, mensagens nem dados dos clientes.
            </p>
          </>
        )}
      </MayaBubble>

      {isFirmSurface && responsible && onQuickSetup ? (
        <Button type="button" variant="primary" fullWidth className="mt-4" onClick={onQuickSetup}>
          Configuração rápida (rascunho com IA)
        </Button>
      ) : null}

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-foreground">
          {isFirmSurface ? 'O que fazer aqui' : 'Temas desta página'}
        </p>
        <div className="space-y-2">
          {intents.map((intent) => (
            <MayaTopicRow key={intent.id} intent={intent} onSelect={() => onOpenIntent(intent.id)} />
          ))}
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2.5 text-left',
              'transition hover:border-brand/30 hover:bg-brand/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            )}
            onClick={onOpenCatalog}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{catalogLabel}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {isFirmSurface ? 'Lista longa — use só se não encontrou acima' : 'Mapa completo do Teglion'}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

function MayaCatalog({
  intents,
  isClientSurface,
  isLandingSurface,
  onOpenIntent,
}: {
  intents: MayaIntent[]
  isClientSurface: boolean
  isLandingSurface?: boolean
  onOpenIntent: (id: string) => void
}) {
  return (
    <div data-testid="maya-catalog">
      <MayaBubble>
        <p>
          {isLandingSurface
            ? 'Escolha o que quer saber sobre o Teglion. Se preferir uma pessoa, há WhatsApp no fim.'
            : isClientSurface
              ? 'Estas são as áreas principais deste portal. Escolha uma para eu explicar.'
              : 'Estas são as áreas principais do escritório no Teglion. Escolha uma para eu explicar.'}
        </p>
      </MayaBubble>
      <div className="mt-4 space-y-2">
        {intents.map((intent) => (
          <MayaTopicRow key={intent.id} intent={intent} onSelect={() => onOpenIntent(intent.id)} />
        ))}
      </div>
    </div>
  )
}

function MayaIntentView({
  intent,
  responsible,
  onOpenIntent,
  onOpenField,
  onOpenProblem,
  onGoToLink,
  onHome,
}: {
  intent: MayaIntent
  responsible: boolean
  onOpenIntent: (id: string) => void
  onOpenField: (fieldId: string) => void
  onOpenProblem: (problemId: string) => void
  onGoToLink: (path: string) => void
  onHome: () => void
}) {
  const related = intent.relatedIntents
    .map((id) => getMayaIntent(id))
    .filter((item): item is MayaIntent => Boolean(item))

  return (
    <div className="space-y-4" data-testid="maya-intent">
      <div className="flex items-end gap-2.5">
        <SafeImage
          src="/maya/maya-avatar-sm.png"
          alt=""
          className="mb-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-brand/20"
        />
        <div
          className={cn(
            'min-w-0 flex-1 rounded-2xl rounded-bl-md border border-brand/15',
            'bg-card px-3.5 py-3 text-sm leading-relaxed text-foreground',
            'shadow-[var(--cb-shadow-card)]',
          )}
        >
          {intent.ownerOnly && !responsible ? (
            <p className="mb-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-950">
              Pode ver esta área, mas ligar pagamentos ou encerrar a conta só está disponível para o
              responsável do escritório. Não tente contornar essa permissão.
            </p>
          ) : null}
          <p>{intent.answer}</p>
          {intent.steps.length ? (
            <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
              {intent.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
          {intent.followUpPrompt ? (
            <p className="mt-3 text-sm text-muted-foreground">{intent.followUpPrompt}</p>
          ) : null}
        </div>
      </div>

      {intent.id === 'maya-setup' && responsible ? (
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={() => {
            openMayaSetupWizard()
            onHome()
          }}
        >
          {intent.ctaLabel || 'Configuração rápida'}
        </Button>
      ) : null}

      {intent.id === 'activation-assistant' && responsible ? (
        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={() => {
            openActivationAssistant()
            onHome()
          }}
        >
          {intent.ctaLabel || 'Assistente de activação'}
        </Button>
      ) : null}

      {intent.deepLink && intent.id !== 'maya-setup' && intent.id !== 'activation-assistant' ? (
        <Button type="button" variant="primary" fullWidth onClick={() => onGoToLink(intent.deepLink)}>
          <ExternalLink className="h-4 w-4" />
          {intent.ctaLabel || `Ir para ${intent.shortDescription}`}
        </Button>
      ) : null}

      {intent.fields?.length ? (
        <div>
          <p className="mb-2 text-caption font-medium text-muted-foreground">Campos e opções</p>
          <div className="flex flex-wrap gap-2">
            {intent.fields.map((field) => (
              <Chip key={field.id} onClick={() => onOpenField(field.id)}>
                {field.name}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {intent.nextSteps?.length ? (
        <div>
          <p className="mb-2 text-caption font-medium text-muted-foreground">Depois disso</p>
          <div className="flex flex-wrap gap-2">
            {intent.nextSteps.map((step) => (
              <Chip
                key={step.label}
                onClick={() => {
                  if (step.intentId) onOpenIntent(step.intentId)
                  else if (step.deepLink) onGoToLink(step.deepLink)
                }}
              >
                {step.label}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {intent.commonProblems?.length ? (
        <div>
          <p className="mb-2 text-caption font-medium text-muted-foreground">Problemas comuns</p>
          <div className="flex flex-wrap gap-2">
            {intent.commonProblems.map((problem) => (
              <Chip key={problem.id} onClick={() => onOpenProblem(problem.id)}>
                {problem.title}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {related.length ? (
        <div>
          <p className="mb-2 text-caption font-medium text-muted-foreground">Outras perguntas</p>
          <div className="flex flex-wrap gap-2">
            {related.map((item) => (
              <Chip key={item.id} onClick={() => onOpenIntent(item.id)}>
                {item.title}
              </Chip>
            ))}
            <Chip onClick={onHome}>Voltar ao início</Chip>
          </div>
        </div>
      ) : (
        <Chip onClick={onHome}>Voltar ao início</Chip>
      )}
    </div>
  )
}

function MayaFieldView({
  field,
  parentTitle,
  onBack,
}: {
  field: MayaFieldHelp
  parentTitle: string
  onBack: () => void
}) {
  return (
    <div className="space-y-4" data-testid="maya-field">
      <MayaBubble>
        <p className="text-caption font-medium text-muted-foreground">{parentTitle}</p>
        <p className="mt-1 font-medium">{field.name}</p>
        <p className="mt-2">{field.meaning}</p>
        {field.why ? (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Para que serve. </span>
            {field.why}
          </p>
        ) : null}
        {field.example ? (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Exemplo. </span>
            {field.example}
          </p>
        ) : null}
        {typeof field.required === 'boolean' ? (
          <p className="mt-2 text-muted-foreground">
            {field.required ? 'Obrigatório.' : 'Opcional.'}
          </p>
        ) : null}
        {field.format ? (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Formato. </span>
            {field.format}
          </p>
        ) : null}
        {field.emptyConsequence ? (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Se ficar vazio. </span>
            {field.emptyConsequence}
          </p>
        ) : null}
        {field.dependsOn ? (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Dependência. </span>
            {field.dependsOn}
          </p>
        ) : null}
        {field.usedWhere ? (
          <p className="mt-2 text-muted-foreground">
            <span className="font-medium text-foreground">Onde é usado. </span>
            {field.usedWhere}
          </p>
        ) : null}
      </MayaBubble>
      <Button type="button" variant="outline" fullWidth onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
    </div>
  )
}

function MayaProblemView({ problem, onBack }: { problem: MayaProblem; onBack: () => void }) {
  return (
    <div className="space-y-4" data-testid="maya-problem">
      <MayaBubble>
        <p className="font-medium">{problem.title}</p>
        <p className="mt-2">{problem.answer}</p>
      </MayaBubble>
      <Button type="button" variant="outline" fullWidth onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
    </div>
  )
}
