import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Landmark,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { IrsServiceEditorDialog } from '@/features/firm/irs/IrsServiceEditorDialog'
import { isModelo3Service } from '@/features/firm/services/IrsModelo3EditorSheet'
import { ServiceFullEditorSheet } from '@/features/firm/services/ServiceFullEditorSheet'
import { getServicePublishPresentation } from '@/features/firm/services/servicePublishState'
import {
  formatEurFromCents,
  isIrsService,
  matchesIrsQuery,
  matchesPublishFilter,
  publishBadgeClass,
  summarizeIrsServices,
  taxYearOf,
  yearsLabelFor,
  type IrsPublishFilter,
} from '@/features/firm/irs/irsFormat'
import { AskMayaButton } from '@/features/maya'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { EmptyState } from '@/shared/design-system'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingService, ConsultingCatalogEntry } from '@/shared/types/contabil'

export function IrsWorkspace() {
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [publishFilter, setPublishFilter] = useState<IrsPublishFilter>('all')
  const [modelSearch, setModelSearch] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorService, setEditorService] = useState<AccountingService | null>(null)
  const [editorPreferModelo3, setEditorPreferModelo3] = useState(false)
  const [editorInitialTabPublish, setEditorInitialTabPublish] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedService, setAdvancedService] = useState<AccountingService | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const servicesQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'irs-hub'],
    queryFn: () => contabilAccountingServicesApi.list(),
  })
  const catalogQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'catalog-template'],
    queryFn: () => contabilAccountingServicesApi.getCatalogTemplate(),
    staleTime: 10 * 60_000,
  })

  const all = servicesQuery.data?.items ?? []
  const firmIrs = useMemo(() => all.filter(isIrsService), [all])
  const summary = useMemo(() => summarizeIrsServices(firmIrs), [firmIrs])
  const campaignReady = summary.published > 0
  const nextUnpublished = firmIrs.find((s) => {
    const id = getServicePublishPresentation(s).id
    return id !== 'published' && id !== 'inactive'
  })

  const filteredServices = useMemo(() => {
    return firmIrs.filter(
      (s) => matchesIrsQuery(s, qDebounced) && matchesPublishFilter(s, publishFilter),
    )
  }, [firmIrs, qDebounced, publishFilter])

  const filterCounts = useMemo(() => {
    const matched = firmIrs.filter((s) => matchesIrsQuery(s, qDebounced))
    return {
      all: matched.length,
      published: matched.filter((s) => matchesPublishFilter(s, 'published')).length,
      internal: matched.filter((s) => matchesPublishFilter(s, 'internal')).length,
      inactive: matched.filter((s) => matchesPublishFilter(s, 'inactive')).length,
    }
  }, [firmIrs, qDebounced])

  const existingKeys = useMemo(
    () => new Set(all.map((s) => s.catalogKey).filter(Boolean) as string[]),
    [all],
  )

  /** Modelos IRS ainda por activar (sem pesquisa) — decide se o bloco aparece. */
  const remainingModels = useMemo(
    () =>
      (catalogQuery.data?.items ?? []).filter(
        (t: ConsultingCatalogEntry) => isIrsService(t) && !existingKeys.has(t.catalogKey),
      ),
    [catalogQuery.data, existingKeys],
  )

  const models = useMemo(() => {
    const mq = modelSearch.trim().toLowerCase()
    if (!mq) return remainingModels
    return remainingModels.filter(
      (t) => t.name.toLowerCase().includes(mq) || t.catalogKey.toLowerCase().includes(mq),
    )
  }, [remainingModels, modelSearch])

  const showTemplatesSection = catalogQuery.isLoading || remainingModels.length > 0

  const publicUrl =
    typeof window !== 'undefined' && firmSlug
      ? `${window.location.origin}/${encodeURIComponent(firmSlug)}`
      : firmSlug
        ? `/${firmSlug}`
        : null

  const kpis = useMemo(
    () => [
      {
        id: 'active',
        label: 'Activos',
        value: String(summary.active),
        tone: 'brand' as const,
        icon: Landmark,
      },
      {
        id: 'published',
        label: 'Publicados',
        value: String(summary.published),
        tone: 'emerald' as const,
        icon: Globe,
      },
      {
        id: 'internal',
        label: 'Só internos',
        value: String(summary.internal),
        tone: 'amber' as const,
        icon: FileText,
      },
      {
        id: 'years',
        label: 'Anos fiscais',
        value: yearsLabelFor(firmIrs),
        tone: 'muted' as const,
        icon: Sparkles,
      },
    ],
    [summary, firmIrs],
  )

  function reload() {
    return qc.invalidateQueries({ queryKey: ['contabil-accounting-services'] })
  }

  function openEditor(
    s: AccountingService | null,
    opts?: { preferModelo3?: boolean; focusPublish?: boolean },
  ) {
    setEditorService(s)
    setEditorPreferModelo3(Boolean(opts?.preferModelo3))
    setEditorInitialTabPublish(Boolean(opts?.focusPublish))
    setEditorOpen(true)
  }

  function openAdvanced(s: AccountingService) {
    setAdvancedService(s)
    setAdvancedOpen(true)
  }

  async function activate(entry: ConsultingCatalogEntry) {
    setBusyKey(entry.catalogKey)
    try {
      const res = await contabilAccountingServicesApi.activateCatalog([entry.catalogKey])
      toast.success(`“${entry.name}” activado — personalize agora`)
      await reload()
      const created =
        (res as { items?: AccountingService[] })?.items?.[0] ||
        (await contabilAccountingServicesApi.list())?.items?.find((s) => s.catalogKey === entry.catalogKey)
      if (!created) return
      openEditor(created, {
        preferModelo3: isModelo3Service(created) || isModelo3Service(entry),
      })
    } catch (err) {
      toast.error('Erro ao activar', { description: getErrorMessage(err) })
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <FirmModuleShell
      className="cb-irs-shell cb-irs-page-scroll"
      title="Área IRS"
      subtitle="Campanha e captação — Modelo 3, anexos e publicação. O Teglion não calcula imposto nem submete à AT."
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <AskMayaButton intentId="irs-campaign" />
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to="/app/firm/services?tab=inquiries">Pedidos</Link>
          </Button>
          {publicUrl ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" aria-hidden />
                Página pública
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openEditor(null)}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Serviço
          </Button>
          <Button type="button" size="sm" onClick={() => openEditor(null, { preferModelo3: true })}>
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Modelo 3
          </Button>
        </div>
      }
      bodyClassName="gap-0 cb-irs-body"
    >
      <div className="cb-irs-kpi-strip" data-testid="irs-kpi-strip">
        {kpis.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.id} className={cn('cb-irs-kpi', `cb-irs-kpi--${item.tone}`)}>
              <span className="cb-irs-kpi-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="cb-irs-kpi-value">{item.value}</p>
                <p className="cb-irs-kpi-label">{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className={cn('cb-irs-campaign', campaignReady ? 'cb-irs-campaign--ready' : 'cb-irs-campaign--pending')}
        data-testid="irs-campaign-status"
      >
        <div className="min-w-0 flex-1">
          <p className="cb-irs-campaign-title">
            {campaignReady
              ? 'Campanha a captar — tem serviços publicados'
              : firmIrs.length === 0
                ? 'Ainda sem serviço IRS'
                : 'Serviços criados — falta publicar'}
          </p>
          <p className="cb-irs-campaign-detail">
            Configurar → publicar na página pública → pedidos em{' '}
            <Link to="/app/firm/services?tab=inquiries" className="font-medium text-brand underline-offset-2 hover:underline">
              Serviços · Solicitações
            </Link>
            . Catálogo geral (não-IRS) em{' '}
            <Link to="/app/firm/services" className="font-medium text-brand underline-offset-2 hover:underline">
              Serviços
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
            {!campaignReady && nextUnpublished ? (
              <Button
                type="button"
                size="sm"
                onClick={() => openEditor(nextUnpublished, { focusPublish: true })}
              >
                Publicar «{nextUnpublished.name}»
              </Button>
            ) : null}
            {!campaignReady && firmIrs.length === 0 ? (
              <Button type="button" size="sm" onClick={() => openEditor(null, { preferModelo3: true })}>
                Começar com Modelo 3
              </Button>
            ) : null}
          {campaignReady ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/app/firm/services?tab=inquiries">Ver Solicitações</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <p className="cb-irs-section-lead">
        <span className="cb-irs-section-lead-title">Serviços IRS do gabinete</span>
        Clique em Editar para oferta, anexos e publicação no mesmo cartão. Banner/formulário avançado fica
        dentro do editor.
      </p>

      <div className="cb-irs-section-host">
        <div className="cb-irs-toolbar">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={q}
              onChange={(e: FormChangeEvent) => setQ(e.target.value)}
              placeholder="Procurar serviço, ano ou slug…"
              aria-label="Procurar serviços IRS"
            />
          </div>
          <div className="cb-irs-health-filters" role="group" aria-label="Filtrar por publicação">
            {(
              [
                { id: 'all', label: 'Todos', count: filterCounts.all },
                { id: 'published', label: 'Publicados', count: filterCounts.published },
                { id: 'internal', label: 'Internos', count: filterCounts.internal },
                { id: 'inactive', label: 'Inactivos', count: filterCounts.inactive },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={cn(
                  'cb-irs-health-chip',
                  `cb-irs-health-chip--${chip.id}`,
                  publishFilter === chip.id && 'cb-irs-health-chip--active',
                )}
                onClick={() => setPublishFilter(chip.id)}
              >
                {chip.label}
                <span className="cb-irs-health-chip-count">{chip.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cb-irs-list">
          {servicesQuery.isLoading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
            </div>
          ) : servicesQuery.isError ? (
            <p className="py-8 text-sm text-destructive">Não foi possível carregar os serviços IRS.</p>
          ) : !firmIrs.length ? (
            <EmptyState
              icon={Landmark}
              title="Ainda sem serviços IRS"
              description="Active um modelo Teglion ou crie um serviço e publique-o na página pública para receber pedidos."
              action={
                <Button type="button" onClick={() => openEditor(null, { preferModelo3: true })}>
                  <Plus className="mr-1 h-4 w-4" aria-hidden />
                  Criar Modelo 3
                </Button>
              }
              secondaryAction={
                <Button type="button" variant="outline" onClick={() => openEditor(null)}>
                  Criar serviço IRS
                </Button>
              }
            />
          ) : !filteredServices.length ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado neste filtro"
              description="Ajuste a pesquisa ou o filtro de publicação."
            />
          ) : (
            <div className="space-y-3 pb-2">
              {filteredServices.map((s) => {
                const year = taxYearOf(s)
                const publish = getServicePublishPresentation(s)
                return (
                  <article key={s.id} className="cb-irs-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold tracking-tight">{s.name}</h2>
                          {year != null ? (
                            <span className="cb-irs-year-chip">{year}</span>
                          ) : null}
                          <span className={publishBadgeClass(publish.id)} title={publish.description}>
                            {publish.label}
                          </span>
                          {isModelo3Service(s) ? (
                            <span className="cb-irs-badge cb-irs-badge--modelo">Modelo 3</span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {s.durationMinutes} min · {formatEurFromCents(s.priceCents)}
                          {s.slug ? ` · /${s.slug}` : ''}
                        </p>
                        {publish.id !== 'published' && publish.id !== 'inactive' ? (
                          <p className="mt-1 text-xs text-amber-800">{publish.description}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {firmSlug && publish.id === 'published' && s.slug ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            title="Ver página do serviço"
                            onClick={() =>
                              window.open(`/${firmSlug}/servicos/${s.slug}`, '_blank', 'noopener,noreferrer')
                            }
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" aria-hidden />
                            Ver
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openEditor(s, {
                              preferModelo3: isModelo3Service(s),
                              focusPublish: publish.id !== 'published',
                            })
                          }
                        >
                          {publish.id === 'published' ? 'Editar' : 'Editar / publicar'}
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {showTemplatesSection ? (
          <section className="cb-irs-templates" data-testid="irs-templates-section">
            <div className="cb-irs-templates-hd">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">Modelos Teglion</h3>
                <p className="text-xs text-muted-foreground">
                  Active e personalize — Modelo 3 abre o assistente de anexos.
                </p>
              </div>
              <div className="relative min-w-[180px] max-w-xs flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 pl-8 text-xs"
                  value={modelSearch}
                  onChange={(e: FormChangeEvent) => setModelSearch(e.target.value)}
                  placeholder="Pesquisar Anexo A, Modelo 3…"
                  aria-label="Pesquisar modelos IRS"
                />
              </div>
            </div>

            {catalogQuery.isLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar modelos…
              </div>
            ) : models.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                Nenhum modelo corresponde à pesquisa.
              </div>
            ) : (
              <ul className="space-y-2">
                {models.map((t) => (
                  <li key={t.catalogKey} className="cb-irs-template-row">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.durationMinutes} min · {formatEurFromCents(t.priceCents)}
                        {t.category ? ` · ${t.category}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyKey === t.catalogKey}
                      onClick={() => void activate(t)}
                    >
                      {busyKey === t.catalogKey ? (
                        <>
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />A activar…
                        </>
                      ) : (
                        'Activar e editar'
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <p className="cb-irs-foot">
          Captação de pedidos IRS no Teglion. Não substitui software certificado nem comunicação à AT.
        </p>
      </div>

      <IrsServiceEditorDialog
        service={editorService}
        open={editorOpen}
        preferModelo3={editorPreferModelo3}
        initialTab={editorInitialTabPublish ? 'publicar' : 'oferta'}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            setEditorService(null)
            setEditorPreferModelo3(false)
            setEditorInitialTabPublish(false)
          }
        }}
        onSaved={() => void reload()}
        onOpenAdvanced={(s) => openAdvanced(s)}
      />

      <ServiceFullEditorSheet
        service={advancedService}
        open={advancedOpen}
        onOpenChange={(open) => {
          setAdvancedOpen(open)
          if (!open) setAdvancedService(null)
        }}
        onSaved={() => void reload()}
      />
    </FirmModuleShell>
  )
}
