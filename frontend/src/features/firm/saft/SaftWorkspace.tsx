import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileArchive,
  Loader2,
  Search,
  Upload,
  Wallet,
} from 'lucide-react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EmptyState } from '@/shared/design-system'
import { contabilSaftApi } from '@/infrastructure/api'
import type { SaftImport } from '@/infrastructure/api/contabil/saft'
import { cn } from '@/shared/lib/utils'
import {
  formatBytes,
  formatEuroFromCents,
  formatPeriod,
  matchesSaftQuery,
  salesCreditCents,
  summarizeImports,
  validationBadgeClass,
  validationLabel,
} from '@/features/firm/saft/saftFormat'
import { SaftUploadDialog } from '@/features/firm/saft/SaftUploadDialog'
import { SaftDetailDialog } from '@/features/firm/saft/SaftDetailDialog'

const LIST_KEY = ['saft-imports'] as const

type HealthFilter = 'all' | 'ok' | 'warning' | 'invalid'

export function SaftWorkspace() {
  const qc = useQueryClient()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [health, setHealth] = useState<HealthFilter>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detail, setDetail] = useState<SaftImport | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300)
    return () => clearTimeout(t)
  }, [q])

  const listQuery = useQuery({
    queryKey: LIST_KEY,
    queryFn: () => contabilSaftApi.list({ limit: 200 }),
  })

  const metaQuery = useQuery({
    queryKey: ['saft-meta'],
    queryFn: () => contabilSaftApi.meta(),
    staleTime: 60_000,
  })

  const allItems = listQuery.data?.items || []
  const disclaimer =
    listQuery.data?.disclaimer ||
    metaQuery.data?.disclaimer ||
    'Leitura interna. Não envia ficheiros à AT nem substitui software certificado.'
  const maxBytes = metaQuery.data?.maxBytes || 25 * 1024 * 1024

  const yearItems = useMemo(() => {
    return allItems.filter((item) => {
      if (item.fiscalYear == null) return true
      return item.fiscalYear === year
    })
  }, [allItems, year])

  const filtered = useMemo(() => {
    return yearItems.filter((item) => {
      if (!matchesSaftQuery(item, qDebounced)) return false
      if (health !== 'all' && item.validationStatus !== health) return false
      return true
    })
  }, [yearItems, qDebounced, health])

  const yearSummary = useMemo(() => summarizeImports(yearItems), [yearItems])
  const healthCounts = useMemo(() => {
    const s = summarizeImports(yearItems.filter((i) => matchesSaftQuery(i, qDebounced)))
    return s
  }, [yearItems, qDebounced])

  const kpis = useMemo(() => {
    return [
      {
        id: 'total',
        label: 'Importações',
        value: String(yearSummary.total),
        tone: 'brand' as const,
        icon: FileArchive,
      },
      {
        id: 'ok',
        label: 'OK',
        value: String(yearSummary.ok),
        tone: 'emerald' as const,
        icon: CheckCircle2,
      },
      {
        id: 'warning',
        label: 'Com avisos',
        value: String(yearSummary.warning),
        tone: 'amber' as const,
        icon: AlertTriangle,
      },
      {
        id: 'sales',
        label: 'Vendas (crédito)',
        value: formatEuroFromCents(yearSummary.salesCents),
        tone: 'muted' as const,
        icon: Wallet,
      },
    ]
  }, [yearSummary])

  function refresh() {
    return qc.invalidateQueries({ queryKey: LIST_KEY })
  }

  const yearsWithData = useMemo(() => {
    const set = new Set<number>()
    for (const item of allItems) {
      if (item.fiscalYear != null) set.add(item.fiscalYear)
    }
    return set
  }, [allItems])

  return (
    <FirmModuleShell
      className="cb-saft-shell cb-saft-page-scroll"
      title="SAF-T (consulta)"
      subtitle="Importação e leitura interna — NIF, período e totais. O Teglion não emite SAF-T nem comunica à AT."
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span
            className="min-w-[4rem] text-center text-sm font-semibold tabular-nums"
            title={yearsWithData.has(year) ? undefined : 'Sem importações neste ano'}
          >
            {year}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1 h-4 w-4" aria-hidden />
            Carregar SAF-T
          </Button>
        </div>
      }
      bodyClassName="gap-0 cb-saft-body"
    >
      {kpis.length > 0 ? (
        <div className="cb-saft-kpi-strip" data-testid="saft-kpi-strip">
          {kpis.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className={cn('cb-saft-kpi', `cb-saft-kpi--${item.tone}`)}>
                <span className="cb-saft-kpi-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="cb-saft-kpi-value">{item.value}</p>
                  <p className="cb-saft-kpi-label">{item.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <p className="cb-saft-section-lead">
        <span className="cb-saft-section-lead-title">Importações SAF-T PT</span>
        Guarda o resumo (NIF, período, totais) e um hash — não arquiva o XML completo. Clique num
        registo para ver detalhe ou apagar.
      </p>

      <div className="cb-saft-section-host">
        <div className="cb-saft-toolbar">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={q}
              onChange={(e: FormChangeEvent) => setQ(e.target.value)}
              placeholder="Procurar empresa, NIF ou ficheiro…"
              aria-label="Procurar importações SAF-T"
            />
          </div>
          <div className="cb-saft-health-filters" role="group" aria-label="Filtrar por validação">
            {(
              [
                { id: 'all', label: 'Todos', count: healthCounts.total },
                { id: 'ok', label: 'OK', count: healthCounts.ok },
                { id: 'warning', label: 'Avisos', count: healthCounts.warning },
                { id: 'invalid', label: 'Inválido', count: healthCounts.invalid },
              ] as const
            ).map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={cn(
                  'cb-saft-health-chip',
                  `cb-saft-health-chip--${chip.id}`,
                  health === chip.id && 'cb-saft-health-chip--active',
                )}
                onClick={() => setHealth(chip.id)}
              >
                {chip.label}
                <span className="cb-saft-health-chip-count">{chip.count}</span>
              </button>
            ))}
          </div>
          <div className="cb-saft-legend" aria-hidden>
            <Legend swatch="cb-saft-badge--ok" label="OK" />
            <Legend swatch="cb-saft-badge--warning" label="Avisos" />
            <Legend swatch="cb-saft-badge--invalid" label="Inválido" />
          </div>
        </div>

        <div className="cb-saft-list">
          {listQuery.isLoading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
            </div>
          ) : listQuery.isError ? (
            <p className="py-8 text-sm text-destructive">Não foi possível listar importações.</p>
          ) : !allItems.length ? (
            <EmptyState
              icon={FileArchive}
              title="Ainda sem SAF-T lidos"
              description="Exporte o SAF-T PT do software do cliente (.xml ou .zip) e carregue aqui para ver totais de vendas e estrutura."
              action={
                <Button type="button" onClick={() => setUploadOpen(true)}>
                  Carregar ficheiro
                </Button>
              }
            />
          ) : !filtered.length ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado neste filtro"
              description={
                yearItems.length
                  ? 'Ajuste a pesquisa ou o filtro de validação.'
                  : `Sem importações com ano fiscal ${year}. Mude o ano ou carregue um ficheiro.`
              }
              action={
                <Button type="button" variant="outline" onClick={() => setUploadOpen(true)}>
                  Carregar SAF-T
                </Button>
              }
            />
          ) : (
            <div className="space-y-3 pb-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="cb-saft-card cb-saft-card-btn"
                  onClick={() => setDetail(item)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 text-left">
                      <h2 className="text-base font-semibold tracking-tight">
                        {item.companyName || item.originalFilename}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        NIF {item.taxRegistrationNumber || '—'}
                        {item.fiscalYear != null ? ` · ${item.fiscalYear}` : ''}
                        {` · ${formatPeriod(item)}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.originalFilename} · {formatBytes(item.fileBytes)} ·{' '}
                        {item.sourceKind.toUpperCase()}
                        {item.productId ? ` · ${item.productId}` : ''}
                      </p>
                    </div>
                    <span className={validationBadgeClass(item.validationStatus)}>
                      {validationLabel(item.validationStatus)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <MiniStat
                      label="Vendas (crédito)"
                      value={formatEuroFromCents(salesCreditCents(item))}
                    />
                    <MiniStat
                      label="Facturas vendas"
                      value={String(item.summary?.salesInvoices?.invoiceCount ?? '—')}
                    />
                    <MiniStat label="Clientes" value={String(item.summary?.customers ?? '—')} />
                    <MiniStat label="Produtos" value={String(item.summary?.products ?? '—')} />
                  </div>

                  {item.validationNotes?.length ? (
                    <p className="mt-2 line-clamp-2 text-left text-xs text-amber-900">
                      {item.validationNotes[0]}
                      {item.validationNotes.length > 1
                        ? ` · +${item.validationNotes.length - 1}`
                        : ''}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="cb-saft-foot">{disclaimer}</p>
      </div>

      <SaftUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        disclaimer={disclaimer}
        maxBytes={maxBytes}
        onImported={() => void refresh()}
      />

      <SaftDetailDialog
        open={Boolean(detail)}
        onOpenChange={(o: boolean) => {
          if (!o) setDetail(null)
        }}
        item={detail}
        onDeleted={() => void refresh()}
      />
    </FirmModuleShell>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-left">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="cb-saft-legend-item">
      <span className={cn('cb-saft-legend-swatch', swatch)} aria-hidden />
      {label}
    </span>
  )
}
