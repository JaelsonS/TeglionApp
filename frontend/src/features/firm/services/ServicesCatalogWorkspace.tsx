import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { ServiceEditorSheet } from '@/features/firm/services/ServiceEditorSheet'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { AccountingService, ConsultingCatalogEntry } from '@/shared/types/contabil'
import type { FormChangeEvent } from '@/shared/types/react-events'

type FilterMode = 'all' | 'active' | 'inactive'

function formatEur(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

function isIrsEntry(s: { name: string; catalogKey?: string | null; category?: string }) {
  if (s.category === 'IRS') return true
  const blob = `${s.name} ${s.catalogKey || ''}`
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob)
}

type Props = {
  services: AccountingService[]
  isLoading?: boolean
  onReload: () => void
  /** Catálogo geral exclui IRS (vão para /app/firm/irs). */
  excludeIrs?: boolean
  title?: string
  description?: string
}

export function ServicesCatalogWorkspace({
  services,
  isLoading,
  onReload,
  excludeIrs = true,
  title = 'Os vossos serviços',
  description,
}: Props) {
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterMode>('active')
  const [modelSearch, setModelSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createName, setCreateName] = useState('')

  const catalogQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'catalog-template'],
    queryFn: () => contabilAccountingServicesApi.getCatalogTemplate(),
    staleTime: 10 * 60_000,
  })

  const firmServices = useMemo(() => {
    let list = excludeIrs ? services.filter((s) => !isIrsEntry(s)) : services
    if (filter === 'active') list = list.filter((s) => s.isActive !== false)
    if (filter === 'inactive') list = list.filter((s) => s.isActive === false)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.catalogKey || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [services, excludeIrs, filter, search])

  const existingKeys = useMemo(
    () => new Set(services.map((s) => s.catalogKey).filter(Boolean) as string[]),
    [services],
  )

  const models = useMemo(() => {
    let items = (catalogQuery.data?.items ?? []).filter((t) => !existingKeys.has(t.catalogKey))
    if (excludeIrs) items = items.filter((t) => !isIrsEntry(t))
    const q = modelSearch.trim().toLowerCase()
    if (q) items = items.filter((t) => t.name.toLowerCase().includes(q) || t.catalogKey.includes(q))
    return items
  }, [catalogQuery.data, existingKeys, excludeIrs, modelSearch])

  const editing = editId ? services.find((s) => s.id === editId) ?? null : null

  const activate = async (entry: ConsultingCatalogEntry) => {
    setBusyKey(entry.catalogKey)
    try {
      await contabilAccountingServicesApi.activateCatalog([entry.catalogKey])
      toast.success(`“${entry.name}” activado no escritório`)
      await onReload()
    } catch (err) {
      toast.error('Não foi possível activar', { description: getErrorMessage(err) })
    } finally {
      setBusyKey(null)
    }
  }

  const toggleActive = async (s: AccountingService) => {
    setBusyKey(s.id)
    try {
      await contabilAccountingServicesApi.patch(s.id, { isActive: s.isActive === false })
      toast.success(s.isActive === false ? 'Serviço activado' : 'Serviço desactivado')
      await onReload()
    } catch (err) {
      toast.error('Erro ao actualizar', { description: getErrorMessage(err) })
    } finally {
      setBusyKey(null)
    }
  }

  const createService = async () => {
    if (!createName.trim()) return
    setCreating(true)
    try {
      await contabilAccountingServicesApi.create({
        name: createName.trim(),
        durationMinutes: 60,
        priceEuros: 0,
        isActive: true,
      })
      toast.success('Serviço criado')
      setCreateOpen(false)
      setCreateName('')
      await onReload()
    } catch (err) {
      toast.error('Erro ao criar', { description: getErrorMessage(err) })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {description ? (
        <p className="shrink-0 text-sm text-muted-foreground">{description}</p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        {/* Esquerda — serviços do escritório */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="shrink-0 space-y-3 border-b border-border/50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              <Button type="button" size="sm" className="rounded-full" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Criar serviço
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[10rem] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-lg pl-8 text-xs"
                  placeholder="Filtrar por nome…"
                  value={search}
                  onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
                />
              </div>
              {(['active', 'all', 'inactive'] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                    filter === mode ? 'bg-brand text-primary-foreground' : 'bg-muted/40 text-muted-foreground',
                  )}
                >
                  {mode === 'active' ? 'Activos' : mode === 'inactive' ? 'Inactivos' : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : firmServices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Sparkles className="h-7 w-7 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Ainda sem serviços neste filtro. Active um modelo Teglion ao lado ou crie um novo.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {firmServices.map((s) => {
                  const active = s.isActive !== false
                  return (
                    <li key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/15">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-caption font-bold uppercase',
                              active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {active ? 'Activo' : 'Inactivo'}
                          </span>
                          {s.isPubliclyListed ? (
                            <span className="inline-flex items-center gap-1 text-caption font-semibold text-brand">
                              <Eye className="h-3 w-3" /> Público
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {s.durationMinutes} min · {formatEur(s.priceCents)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={active ? 'Desactivar' : 'Activar'}
                          disabled={busyKey === s.id}
                          onClick={() => void toggleActive(s)}
                        >
                          {active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                        </Button>
                        {firmSlug && s.slug && s.isPubliclyListed ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Ver página pública"
                            onClick={() =>
                              window.open(`/${firmSlug}/servicos/${s.slug}`, '_blank', 'noopener,noreferrer')
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() => setEditId(s.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Direita — modelos Teglion */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="shrink-0 space-y-3 border-b border-border/50 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Modelos Teglion</h3>
              <p className="text-xs text-muted-foreground">Active e edite conforme o escritório precisa.</p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 rounded-lg pl-8 text-xs"
                placeholder="Pesquisar modelos…"
                value={modelSearch}
                onChange={(e: FormChangeEvent) => setModelSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {catalogQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/50" />
                <p className="text-sm text-muted-foreground">Já activou todos os modelos disponíveis neste filtro.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {models.map((t) => (
                  <li key={t.catalogKey} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-caption font-bold uppercase text-amber-900">
                          Sugestão
                        </span>
                        {t.category ? (
                          <span className="text-caption text-muted-foreground">{t.category}</span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.durationMinutes} min · {formatEur(t.priceCents)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
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
      </div>

      {editing ? (
        <ServiceEditorSheet
          service={editing}
          open={Boolean(editId)}
          onOpenChange={(open) => !open && setEditId(null)}
          onSaved={() => void onReload()}
        />
      ) : null}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHiddenTitle>Criar serviço</SheetHiddenTitle>
          <div className="space-y-4 py-4">
            <h2 className="text-lg font-semibold">Novo serviço</h2>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Nome</span>
              <Input
                className="rounded-xl"
                value={createName}
                onChange={(e: FormChangeEvent) => setCreateName(e.target.value)}
                placeholder="Ex.: Consultoria fiscal"
              />
            </label>
            <Button type="button" className="rounded-full" disabled={creating || !createName.trim()} onClick={() => void createService()}>
              {creating ? 'A criar…' : 'Criar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
