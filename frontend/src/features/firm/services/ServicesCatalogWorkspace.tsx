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

import { ServiceFullEditorSheet } from '@/features/firm/services/ServiceFullEditorSheet'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
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
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob) || /^irs-/.test(s.catalogKey || '')
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
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingService, setEditingService] = useState<AccountingService | null>(null)
  const [catalogHint, setCatalogHint] = useState<{ name?: string; catalogKey?: string } | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

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

  const openEditor = (s: AccountingService | null, hint?: { name?: string; catalogKey?: string } | null) => {
    setEditingService(s)
    setCatalogHint(hint ?? null)
    setEditorOpen(true)
  }

  const activate = async (entry: ConsultingCatalogEntry) => {
    setBusyKey(entry.catalogKey)
    try {
      const res = await contabilAccountingServicesApi.activateCatalog([entry.catalogKey])
      toast.success(`“${entry.name}” activado — personalize agora`)
      await onReload()
      const created =
        (res as { items?: AccountingService[] })?.items?.[0] ||
        (
          await contabilAccountingServicesApi.list()
        )?.items?.find((s: AccountingService) => s.catalogKey === entry.catalogKey)
      if (created) {
        openEditor(created)
      }
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {description ? (
        <p className="shrink-0 text-sm text-muted-foreground">{description}</p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-brand/20 bg-card shadow-sm">
          <div className="shrink-0 space-y-3 border-b border-brand/10 bg-gradient-to-r from-brand/[0.06] to-transparent px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              <Button type="button" size="sm" className="rounded-full bg-brand" onClick={() => openEditor(null)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Criar serviço
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Clique na caneta para editar tudo: banner, formulário, logótipo, publicação e pré-visualização.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[10rem] flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-9 rounded-lg border-brand/20 pl-8 text-xs"
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
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : firmServices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <Sparkles className="h-7 w-7 text-brand/40" />
                <p className="text-sm text-muted-foreground">
                  Ainda sem serviços neste filtro. Active um modelo Teglion ao lado ou crie um novo.
                </p>
                <Button type="button" size="sm" className="rounded-full bg-brand" onClick={() => openEditor(null)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Criar serviço
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {firmServices.map((s) => {
                  const active = s.isActive !== false
                  return (
                    <li key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-brand/[0.03]">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-caption font-bold uppercase',
                              active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground',
                            )}
                            title={
                              active
                                ? 'Disponível no escritório (pode ainda não estar no site)'
                                : 'Desactivado — não aparece para a equipa nem no site'
                            }
                          >
                            {active ? 'Activo' : 'Inactivo'}
                          </span>
                          {s.isPubliclyListed ? (
                            <span
                              className="rounded-full bg-sky-100 px-2 py-0.5 text-caption font-bold uppercase text-sky-900"
                              title="Visível na página pública do escritório"
                            >
                              No site
                            </span>
                          ) : (
                            <span
                              className="rounded-full bg-muted px-2 py-0.5 text-caption font-bold uppercase text-muted-foreground"
                              title="Só interno — ainda não publicado no site"
                            >
                              Só interno
                            </span>
                          )}
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
                          variant="outline"
                          className="h-8 w-8 border-brand/30 text-brand"
                          title="Editar completo (banner, formulário, publicação…)"
                          onClick={() => openEditor(s)}
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

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-brand/20 bg-card shadow-sm">
          <div className="shrink-0 space-y-3 border-b border-brand/10 bg-gradient-to-r from-sky-500/[0.07] to-transparent px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Modelos Teglion</h3>
              <p className="text-xs text-muted-foreground">
                Active um modelo — abre de seguida o editor completo para personalizar.
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 rounded-lg border-brand/20 pl-8 text-xs"
                placeholder="Pesquisar modelos…"
                value={modelSearch}
                onChange={(e: FormChangeEvent) => setModelSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {catalogQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600/60" />
                <p className="text-sm text-muted-foreground">Já activou todos os modelos disponíveis neste filtro.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {models.map((t) => (
                  <li key={t.catalogKey} className="flex items-center gap-3 px-4 py-3 hover:bg-sky-50/40">
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
      </div>

      <ServiceFullEditorSheet
        service={editingService}
        open={editorOpen}
        initialCatalogHint={catalogHint}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            setEditingService(null)
            setCatalogHint(null)
          }
        }}
        onSaved={() => void onReload()}
      />
    </div>
  )
}
