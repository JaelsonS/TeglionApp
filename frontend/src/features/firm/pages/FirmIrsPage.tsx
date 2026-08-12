import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Landmark, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'

import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { ServiceEditorSheet } from '@/features/firm/services/ServiceEditorSheet'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
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
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob)
}

const YEAR = new Date().getFullYear()

export function FirmIrsPage() {
  const qc = useQueryClient()
  const [modelSearch, setModelSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

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

  const existingKeys = useMemo(
    () => new Set(all.map((s: AccountingService) => s.catalogKey).filter(Boolean) as string[]),
    [all],
  )

  const models = useMemo(() => {
    let items = (catalogQuery.data?.items ?? []).filter(
      (t: ConsultingCatalogEntry) => isIrs(t) && !existingKeys.has(t.catalogKey),
    )
    const q = modelSearch.trim().toLowerCase()
    if (q) items = items.filter((t) => t.name.toLowerCase().includes(q) || t.catalogKey.includes(q))
    return items
  }, [catalogQuery.data, existingKeys, modelSearch])

  const editing = editId ? (firmIrs.find((s: AccountingService) => s.id === editId) ?? null) : null

  const reload = () => qc.invalidateQueries({ queryKey: ['contabil-accounting-services'] })

  const activate = async (entry: ConsultingCatalogEntry) => {
    setBusyKey(entry.catalogKey)
    try {
      await contabilAccountingServicesApi.activateCatalog([entry.catalogKey])
      toast.success(`“${entry.name}” activado`)
      await reload()
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
        subtitle={`Campanha ${YEAR} — modelos prontos e serviços do escritório`}
        bodyClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4"
      >
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Campanha', value: String(YEAR) },
            { label: 'Serviços IRS', value: String(firmIrs.length) },
            { label: 'Activos', value: String(activeIrs.length) },
            { label: 'Públicos', value: String(publicIrs.length) },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-border/60 bg-card px-3 py-2.5">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Como funciona:</span> active um modelo → edite preço e
          formulário → publique na página. O cliente preenche online; a equipa recebe em{' '}
          <span className="font-semibold text-foreground">Solicitações</span> — sem pedir documentos automaticamente.
        </div>

        <div className="grid min-h-[28rem] gap-3 lg:grid-cols-2">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="shrink-0 border-b border-border/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold">Modelos prontos Teglion</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Pack IRS Portugal — active o que o escritório oferece.</p>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-lg pl-8 text-xs"
                  placeholder="Pesquisar Anexo A, Modelo 3, IRS Jovem…"
                  value={modelSearch}
                  onChange={(e: FormChangeEvent) => setModelSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {catalogQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : models.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600/50" />
                  <p className="text-sm text-muted-foreground">Todos os modelos IRS já estão no escritório.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {models.map((t) => (
                    <li key={t.catalogKey} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.durationMinutes} min · {formatEur(t.priceCents)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 rounded-full"
                        disabled={busyKey === t.catalogKey}
                        onClick={() => void activate(t)}
                      >
                        {busyKey === t.catalogKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Activar'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
            <div className="shrink-0 border-b border-border/50 px-4 py-3">
              <h3 className="text-sm font-semibold">Os vossos serviços IRS</h3>
              <p className="mt-1 text-xs text-muted-foreground">Cópias do escritório — edite e publique.</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {servicesQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : firmIrs.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Ainda sem serviços IRS. Active um modelo à esquerda.
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {firmIrs.map((s: AccountingService) => (
                    <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-caption font-bold uppercase',
                              s.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {s.isActive !== false ? 'Activo' : 'Inactivo'}
                          </span>
                          {s.isPubliclyListed ? (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-caption font-bold uppercase text-sky-900">
                              Publicado
                            </span>
                          ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-caption font-bold uppercase text-muted-foreground">
                              Rascunho
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {s.durationMinutes} min · {formatEur(s.priceCents)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-full"
                        onClick={() => setEditId(s.id)}
                      >
                        Abrir
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {editing ? (
          <ServiceEditorSheet
            service={editing}
            open={Boolean(editId)}
            onOpenChange={(open) => !open && setEditId(null)}
            onSaved={() => void reload()}
          />
        ) : null}
      </FirmModuleShell>
    </FirmWorkspacePage>
  )
}
