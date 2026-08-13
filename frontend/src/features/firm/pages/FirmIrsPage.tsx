import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ExternalLink, Eye, HelpCircle, Landmark, Loader2, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { IrsModelo3EditorSheet, isModelo3Service } from '@/features/firm/services/IrsModelo3EditorSheet'
import { ServiceFullEditorSheet } from '@/features/firm/services/ServiceFullEditorSheet'
import { getServicePublishPresentation } from '@/features/firm/services/servicePublishState'
import { openMaya } from '@/features/maya/openMaya'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { ModuleHelpDialog } from '@/shared/design-system/ModuleHelpDialog'
import { EmptyState } from '@/shared/design-system'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingService, ConsultingCatalogEntry } from '@/shared/types/contabil'
import type { FormChangeEvent } from '@/shared/types/react-events'

function formatEur(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

function isIrs(s: { name: string; catalogKey?: string | null; category?: string }) {
  if (s.category === 'IRS') return true
  const blob = `${s.name} ${s.catalogKey || ''}`
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob) || /^irs-/.test(s.catalogKey || '')
}

function taxYearOf(s: AccountingService): number | null {
  const y = s.intakeForm?.irsConfig?.taxYear
  return typeof y === 'number' && Number.isFinite(y) ? y : null
}

export function FirmIrsPage() {
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug
  const qc = useQueryClient()
  const [modelSearch, setModelSearch] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const [fullOpen, setFullOpen] = useState(false)
  const [fullService, setFullService] = useState<AccountingService | null>(null)
  const [fullHint, setFullHint] = useState<{ name?: string; catalogKey?: string } | null>(null)

  const [modelo3Open, setModelo3Open] = useState(false)
  const [modelo3Service, setModelo3Service] = useState<AccountingService | null>(null)

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
  const firmIrs = useMemo(() => all.filter(isIrs), [all])
  const activeIrs = firmIrs.filter((s: AccountingService) => s.isActive !== false)
  const publicIrs = firmIrs.filter(
    (s: AccountingService) => getServicePublishPresentation(s).id === 'published',
  )
  const campaignReady = publicIrs.length > 0
  const nextUnpublished = firmIrs.find(
    (s: AccountingService) => getServicePublishPresentation(s).id !== 'published' && s.isActive !== false,
  )

  const yearsLabel = useMemo(() => {
    const years: number[] = []
    for (const s of firmIrs) {
      const y = taxYearOf(s)
      if (y != null && !years.includes(y)) years.push(y)
    }
    years.sort((a, b) => Number(a) - Number(b))
    if (!years.length) return 'Por serviço'
    return years.join(' · ')
  }, [firmIrs])

  const publicUrl =
    typeof window !== 'undefined' && firmSlug
      ? `${window.location.origin}/${encodeURIComponent(firmSlug)}`
      : firmSlug
        ? `/${firmSlug}`
        : null

  const existingKeys = useMemo(
    () => new Set(all.map((s: AccountingService) => s.catalogKey).filter(Boolean) as string[]),
    [all],
  )

  const models = useMemo(() => {
    let items = (catalogQuery.data?.items ?? []).filter(
      (t: ConsultingCatalogEntry) => isIrs(t) && !existingKeys.has(t.catalogKey),
    )
    const q = modelSearch.trim().toLowerCase()
    if (q) {
      items = items.filter(
        (t: ConsultingCatalogEntry) =>
          t.name.toLowerCase().includes(q) || t.catalogKey.includes(q),
      )
    }
    return items
  }, [catalogQuery.data, existingKeys, modelSearch])

  const reload = () => qc.invalidateQueries({ queryKey: ['contabil-accounting-services'] })

  const openFull = (s: AccountingService | null, hint?: { name?: string; catalogKey?: string } | null) => {
    setFullService(s)
    setFullHint(hint ?? null)
    setFullOpen(true)
  }

  const openModelo3 = (s: AccountingService | null) => {
    setModelo3Service(s)
    setModelo3Open(true)
  }

  const activate = async (entry: ConsultingCatalogEntry) => {
    setBusyKey(entry.catalogKey)
    try {
      const res = await contabilAccountingServicesApi.activateCatalog([entry.catalogKey])
      toast.success(`“${entry.name}” activado — personalize agora`)
      await reload()
      const created =
        (res as { items?: AccountingService[] })?.items?.[0] ||
        (await contabilAccountingServicesApi.list())?.items?.find(
          (s: AccountingService) => s.catalogKey === entry.catalogKey,
        )
      if (!created) return
      if (isModelo3Service(created) || isModelo3Service(entry)) {
        openModelo3(created)
      } else {
        openFull(created)
      }
    } catch (err) {
      toast.error('Erro ao activar', { description: getErrorMessage(err) })
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <FirmWorkspacePage className="cb-irs-layout-page xl:min-h-0 xl:flex-1">
      <FirmModuleShell
        className="cb-firm-operational-panel min-h-0 flex-1 overflow-hidden"
        title="Campanha IRS"
        subtitle="Divulgue o apoio à entrega do IRS e receba pedidos — o Teglion não calcula o imposto."
        headerRight={
          <div className="flex flex-wrap items-center gap-2">
            <ModuleHelpDialog
              title="Campanha IRS no Teglion"
              intro="Configure serviços IRS, publique-os na página pública e trate os pedidos em Solicitações. Não é software de cálculo fiscal."
              triggerLabel="Guia"
              steps={[
                {
                  title: '1. Configurar campanha',
                  description: 'Active um modelo (ex.: Modelo 3) ou crie um serviço IRS.',
                },
                {
                  title: '2. Publicar',
                  description: 'No editor completo, marque publicação e defina o slug.',
                },
                {
                  title: '3. Ver página e pedidos',
                  description: 'Partilhe a página pública; novos contactos chegam a Serviços → Solicitações.',
                },
              ]}
            />
            <Button type="button" size="sm" variant="outline" onClick={() => openMaya('irs-campaign')}>
              <HelpCircle className="h-4 w-4" />
              Ajuda
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/app/firm/services?tab=inquiries">Ver pedidos</Link>
            </Button>
            {publicUrl ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Página pública
                </a>
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openFull(null, { name: 'Serviço IRS', catalogKey: undefined })}
            >
              <Plus className="h-4 w-4" />
              Criar serviço
            </Button>
            <Button type="button" size="sm" variant="primary" onClick={() => openModelo3(null)}>
              <Plus className="h-4 w-4" />
              Modelo 3
            </Button>
          </div>
        }
        bodyClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4"
      >
        <div
          className={cn(
            'mb-3 rounded-xl border px-4 py-3',
            campaignReady ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/40',
          )}
          data-testid="irs-campaign-status"
        >
          <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">Estado da campanha</p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {campaignReady
              ? 'A campanha IRS está a captar — tem serviços publicados na página pública.'
              : firmIrs.length === 0
                ? 'Ainda não há serviço IRS. Active um modelo ou crie um serviço para começar.'
                : 'Tem serviços IRS, mas ainda não estão publicados na página pública.'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fluxo: configurar serviço → publicar → ver página → receber pedidos em Solicitações.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!campaignReady && nextUnpublished ? (
              <Button type="button" size="sm" variant="primary" onClick={() => openFull(nextUnpublished)}>
                Publicar «{nextUnpublished.name}»
              </Button>
            ) : null}
            {!campaignReady && firmIrs.length === 0 ? (
              <Button type="button" size="sm" variant="primary" onClick={() => openModelo3(null)}>
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

        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            { label: 'Anos fiscais', value: yearsLabel },
            { label: 'Serviços IRS', value: `${activeIrs.length} activos` },
            { label: 'Publicados', value: String(publicIrs.length) },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid min-h-[28rem] gap-3 lg:grid-cols-2">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-brand/20 bg-card shadow-sm">
            <div className="shrink-0 border-b border-brand/10 bg-gradient-to-r from-brand/[0.07] to-transparent px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-primary-foreground">
                  <Landmark className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold">Modelos prontos Teglion</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Active e edite — Modelo 3 abre o assistente de anexos; os outros abrem o editor completo.
              </p>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-lg border-brand/20 pl-8 text-xs"
                  placeholder="Pesquisar Anexo A, Modelo 3, IRS Jovem…"
                  value={modelSearch}
                  onChange={(e: FormChangeEvent) => setModelSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {catalogQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                </div>
              ) : models.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600/60" />
                  <p className="text-sm text-muted-foreground">Todos os modelos IRS já estão no escritório.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {models.map((t: ConsultingCatalogEntry) => (
                    <li key={t.catalogKey} className="flex items-center gap-3 px-4 py-3 hover:bg-brand/[0.03]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.durationMinutes} min · {formatEur(t.priceCents)}
                          {t.category ? ` · ${t.category}` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 rounded-full bg-brand"
                        disabled={busyKey === t.catalogKey}
                        onClick={() => void activate(t)}
                      >
                        {busyKey === t.catalogKey ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Activar e editar'
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-brand/20 bg-card shadow-sm">
            <div className="shrink-0 border-b border-brand/10 bg-gradient-to-r from-sky-500/[0.08] to-transparent px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">Os vossos serviços IRS</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Editar abre o editor completo (banner, formulário, apagar…). Modelo 3 também tem Anexos.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full border-brand/30 text-brand hover:bg-brand/5"
                  onClick={() => openFull(null, { name: 'Serviço IRS' })}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Criar
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {servicesQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-brand" />
                </div>
              ) : firmIrs.length === 0 ? (
                <EmptyState
                  className="m-3 border-0 bg-transparent"
                  icon={Landmark}
                  title="Ainda sem serviços IRS"
                  description="Use esta área para campanha e captação de pedidos relacionados com IRS. O Teglion não calcula o imposto — active um modelo ou crie um serviço e publique-o na página pública."
                  action={
                    <Button type="button" size="sm" variant="primary" onClick={() => openModelo3(null)}>
                      <Plus className="h-4 w-4" />
                      Criar Modelo 3
                    </Button>
                  }
                  secondaryAction={
                    <Button type="button" size="sm" variant="outline" onClick={() => openFull(null, { name: 'Serviço IRS' })}>
                      Criar serviço IRS
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border/40">
                  {firmIrs.map((s: AccountingService) => {
                    const year = taxYearOf(s)
                    const publish = getServicePublishPresentation(s)
                    return (
                      <li key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-sky-50/50">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium">{s.name}</p>
                            {year != null ? (
                              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-caption font-bold uppercase text-brand">
                                {year}
                              </span>
                            ) : null}
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-caption font-bold uppercase',
                                publish.id === 'published'
                                  ? 'bg-sky-100 text-sky-900'
                                  : publish.id === 'inactive'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-amber-100 text-amber-900',
                              )}
                              title={publish.description}
                            >
                              {publish.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {s.durationMinutes} min · {formatEur(s.priceCents)}
                            {isModelo3Service(s) ? ' · Modelo 3' : ''}
                          </p>
                          {publish.id !== 'published' && publish.id !== 'inactive' ? (
                            <p className="mt-1 text-caption text-amber-800 dark:text-amber-400">{publish.description}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
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
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                          {isModelo3Service(s) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openModelo3(s)}
                            >
                              Anexos
                            </Button>
                          ) : null}
                          <Button type="button" size="sm" variant="primary" onClick={() => openFull(s)}>
                            {publish.id === 'published' ? 'Editar' : 'Publicar'}
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <ServiceFullEditorSheet
          service={fullService}
          open={fullOpen}
          initialCatalogHint={fullHint}
          onOpenChange={(open) => {
            setFullOpen(open)
            if (!open) {
              setFullService(null)
              setFullHint(null)
            }
          }}
          onSaved={() => void reload()}
        />

        <IrsModelo3EditorSheet
          service={modelo3Service}
          open={modelo3Open}
          onOpenChange={(open) => {
            setModelo3Open(open)
            if (!open) setModelo3Service(null)
          }}
          onSaved={() => void reload()}
        />
      </FirmModuleShell>
    </FirmWorkspacePage>
  )
}
