import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Landmark, Loader2, Plus, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { IrsModelo3EditorSheet, isModelo3Service } from '@/features/firm/services/IrsModelo3EditorSheet'
import { ServiceFullEditorSheet } from '@/features/firm/services/ServiceFullEditorSheet'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { ModuleHelpDialog } from '@/shared/design-system/ModuleHelpDialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
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
  const publicIrs = firmIrs.filter((s: AccountingService) => s.isPubliclyListed)

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
        title="IRS"
        subtitle="Campanha IRS — modelos prontos e serviços do escritório"
        headerRight={
          <div className="flex flex-wrap items-center gap-2">
            <ModuleHelpDialog
              title="IRS"
              intro="Campanha IRS: active ou crie serviços, configure banner, formulário, anexos e pagamento, e publique no site. A equipa recebe pedidos em Solicitações."
              triggerLabel="Guia"
              steps={[
                {
                  title: 'Modelos prontos',
                  description: 'Active um modelo Teglion à esquerda — Modelo 3 abre o assistente de anexos.',
                },
                {
                  title: 'Os vossos serviços',
                  description: 'Edite, publique no site e acompanhe anos fiscais em cada serviço IRS.',
                },
                {
                  title: 'Criar do zero',
                  description: 'Use «Criar serviço» ou «Modelo 3 + Anexos» para começar rapidamente.',
                },
              ]}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-md"
              onClick={() => openFull(null, { name: 'Serviço IRS', catalogKey: undefined })}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Criar serviço
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-md bg-brand"
              onClick={() => openModelo3(null)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Modelo 3 + Anexos
            </Button>
          </div>
        }
        bodyClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4"
      >
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Campanha', value: 'IRS', accent: true },
            { label: 'Anos fiscais', value: yearsLabel, accent: false },
            { label: 'Serviços IRS', value: String(firmIrs.length), accent: false },
            { label: 'Activos / No site', value: `${activeIrs.length} / ${publicIrs.length}`, accent: false },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={cn(
                'rounded-xl border px-3 py-2.5 shadow-sm',
                kpi.accent
                  ? 'border-brand/30 bg-gradient-to-br from-brand to-brand/85 text-primary-foreground'
                  : 'border-brand/15 bg-card',
              )}
            >
              <p
                className={cn(
                  'text-caption font-semibold uppercase tracking-wide',
                  kpi.accent ? 'text-primary-foreground/80' : 'text-brand/70',
                )}
              >
                {kpi.label}
              </p>
              <p
                className={cn(
                  'mt-0.5 text-lg font-semibold tabular-nums sm:text-xl',
                  kpi.accent ? 'text-primary-foreground' : 'text-foreground',
                )}
              >
                {kpi.value}
              </p>
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
                <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                  <Sparkles className="h-8 w-8 text-brand/40" />
                  <p className="text-sm text-muted-foreground">
                    Ainda sem serviços IRS. Crie um ou active um modelo à esquerda.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {firmIrs.map((s: AccountingService) => {
                    const year = taxYearOf(s)
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
                                s.isActive !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-muted text-muted-foreground',
                              )}
                              title="Activo = disponível no escritório"
                            >
                              {s.isActive !== false ? 'Activo' : 'Inactivo'}
                            </span>
                            {s.isPubliclyListed ? (
                              <span
                                className="rounded-full bg-sky-100 px-2 py-0.5 text-caption font-bold uppercase text-sky-900"
                                title="Visível na página pública"
                              >
                                No site
                              </span>
                            ) : (
                              <span
                                className="rounded-full bg-muted px-2 py-0.5 text-caption font-bold uppercase text-muted-foreground"
                                title="Ainda não publicado no site"
                              >
                                Só interno
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {s.durationMinutes} min · {formatEur(s.priceCents)}
                            {isModelo3Service(s) ? ' · Modelo 3' : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
                          {isModelo3Service(s) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-full border-brand/25"
                              onClick={() => openModelo3(s)}
                            >
                              Anexos
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full bg-brand"
                            onClick={() => openFull(s)}
                          >
                            Editar
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
