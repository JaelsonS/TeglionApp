import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileArchive, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { EmptyState } from '@/shared/design-system'
import { contabilSaftApi } from '@/infrastructure/api'
import type { SaftImport } from '@/infrastructure/api/contabil/saft'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

const LIST_KEY = ['saft-imports'] as const

function formatEuro(cents: number | null | undefined) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function SaftWorkspace() {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const listQuery = useQuery({
    queryKey: LIST_KEY,
    queryFn: () => contabilSaftApi.list({ limit: 50 }),
  })

  async function onPick(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const res = await contabilSaftApi.importFile(file)
      if (res.duplicate) {
        toast.message('Este ficheiro já tinha sido importado', {
          description: res.item.companyName || res.item.originalFilename,
        })
      } else {
        toast.success('SAF-T lido', {
          description: `${res.item.companyName || 'Empresa'} · ${res.item.fiscalYear || '—'}`,
        })
      }
      await qc.invalidateQueries({ queryKey: LIST_KEY })
    } catch (err) {
      toast.error('Não foi possível ler o SAF-T', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove(item: SaftImport) {
    try {
      await contabilSaftApi.remove(item.id)
      toast.success('Importação removida')
      await qc.invalidateQueries({ queryKey: LIST_KEY })
    } catch (err) {
      toast.error('Não foi possível remover', { description: getErrorMessage(err) })
    }
  }

  const items = listQuery.data?.items || []
  const disclaimer =
    listQuery.data?.disclaimer ||
    'Leitura interna. Não envia ficheiros à AT nem substitui software certificado.'

  return (
    <FirmModuleShell
      title="SAF-T (consulta)"
      subtitle="Importação e leitura interna do ficheiro — veja NIF, período e totais. O Teglion não emite SAF-T nem comunica à AT."
      bodyClassName="min-h-0 flex-1 overflow-auto px-4 pb-6 sm:px-5"
      headerRight={
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".xml,.zip,application/xml,text/xml,application/zip"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] || null)}
          />
          <Button type="button" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="mr-1 h-4 w-4" aria-hidden />
            )}
            Carregar SAF-T
          </Button>
        </>
      }
    >
      <div className="mb-4 shrink-0 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
        <p className="font-medium">Só consulta e importação — não é emissão oficial</p>
        <p className="mt-1 text-amber-950/90">{disclaimer}</p>
        <p className="mt-2 text-xs text-amber-900/80">
          Fluxo: exporte o SAF-T PT no software certificado do cliente → carregue aqui → consulte totais.
          O Teglion guarda o resumo (NIF, período, totais) e um hash — não arquiva o XML completo nesta
          versão.
        </p>
      </div>

      {listQuery.isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
        </div>
      ) : listQuery.isError ? (
        <p className="py-8 text-sm text-destructive">Não foi possível listar importações.</p>
      ) : !items.length ? (
        <EmptyState
          icon={FileArchive}
          title="Ainda sem SAF-T lidos"
          description="Exporte o SAF-T PT do software do cliente (.xml ou .zip) e carregue aqui para ver totais de vendas e estrutura."
          action={
            <Button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
              Carregar ficheiro
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border/70 bg-background/60 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {item.companyName || item.originalFilename}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    NIF {item.taxRegistrationNumber || '—'}
                    {item.fiscalYear ? ` · ${item.fiscalYear}` : ''}
                    {item.startDate && item.endDate
                      ? ` · ${item.startDate} → ${item.endDate}`
                      : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.originalFilename} · {formatBytes(item.fileBytes)} · {item.sourceKind.toUpperCase()}
                    {item.auditFileVersion ? ` · v${item.auditFileVersion}` : ''}
                    {item.productId ? ` · ${item.productId}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-xs font-medium',
                      item.validationStatus === 'ok' &&
                        'border-emerald-200 bg-emerald-50 text-emerald-900',
                      item.validationStatus === 'warning' &&
                        'border-amber-200 bg-amber-50 text-amber-950',
                      item.validationStatus === 'invalid' &&
                        'border-red-200 bg-red-50 text-red-900',
                    )}
                  >
                    {item.validationStatus === 'ok'
                      ? 'OK'
                      : item.validationStatus === 'warning'
                        ? 'Avisos'
                        : 'Inválido'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="Remover"
                    onClick={() => remove(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Vendas (crédito)"
                  value={formatEuro(item.summary?.salesInvoices?.totalCreditCents)}
                />
                <Stat
                  label="Facturas vendas"
                  value={String(item.summary?.salesInvoices?.invoiceCount ?? '—')}
                />
                <Stat label="Clientes" value={String(item.summary?.customers ?? '—')} />
                <Stat label="Produtos" value={String(item.summary?.products ?? '—')} />
              </div>

              {item.validationNotes?.length ? (
                <ul className="mt-3 list-disc space-y-0.5 pl-5 text-xs text-amber-900">
                  {item.validationNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </FirmModuleShell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  )
}
