import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { contabilSaftApi } from '@/infrastructure/api'
import type { SaftImport } from '@/infrastructure/api/contabil/saft'
import { getErrorMessage } from '@/shared/utils/errors'
import {
  formatBytes,
  formatEuroFromCents,
  formatPeriod,
  validationBadgeClass,
  validationLabel,
} from '@/features/firm/saft/saftFormat'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: SaftImport | null
  onDeleted: () => void
}

export function SaftDetailDialog({ open, onOpenChange, item, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [removing, setRemoving] = useState(false)

  async function remove() {
    if (!item) return
    setRemoving(true)
    try {
      await contabilSaftApi.remove(item.id)
      toast.success('Importação apagada')
      onDeleted()
      onOpenChange(false)
      setConfirmDelete(false)
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setRemoving(false)
    }
  }

  const sales = item?.summary?.salesInvoices
  const purchase = item?.summary?.purchaseInvoices

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirmDelete(false)
        onOpenChange(o)
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-5 py-4 text-left">
          <DialogTitle className="pr-8">{item?.companyName || item?.originalFilename || 'SAF-T'}</DialogTitle>
          <DialogDescription>
            Resumo interno — o Teglion não guarda o XML completo nem envia ficheiros à AT.
          </DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={validationBadgeClass(item.validationStatus)}>
                {validationLabel(item.validationStatus)}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.sourceKind.toUpperCase()}
                {item.auditFileVersion ? ` · v${item.auditFileVersion}` : ''}
              </span>
            </div>

            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Meta label="NIF" value={item.taxRegistrationNumber || '—'} />
              <Meta label="Ano fiscal" value={item.fiscalYear != null ? String(item.fiscalYear) : '—'} />
              <Meta label="Período" value={formatPeriod(item)} />
              <Meta label="Moeda" value={item.currencyCode || '—'} />
              <Meta label="Ficheiro" value={`${item.originalFilename} · ${formatBytes(item.fileBytes)}`} />
              <Meta
                label="Produto"
                value={
                  item.productId
                    ? `${item.productId}${item.productVersion ? ` ${item.productVersion}` : ''}`
                    : '—'
                }
              />
            </dl>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">Totais</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Stat label="Vendas (crédito)" value={formatEuroFromCents(sales?.totalCreditCents)} />
                <Stat label="Vendas (débito)" value={formatEuroFromCents(sales?.totalDebitCents)} />
                <Stat label="Facturas vendas" value={String(sales?.invoiceCount ?? '—')} />
                <Stat label="Linhas declaradas" value={String(sales?.declaredEntries ?? '—')} />
                <Stat label="Facturas compra" value={String(purchase?.invoiceCount ?? '—')} />
                <Stat label="Clientes" value={String(item.summary?.customers ?? '—')} />
                <Stat label="Fornecedores" value={String(item.summary?.suppliers ?? '—')} />
                <Stat label="Produtos" value={String(item.summary?.products ?? '—')} />
                <Stat label="Pagamentos" value={String(item.summary?.payments ?? '—')} />
                <Stat label="Mov. stock" value={String(item.summary?.stockMovements ?? '—')} />
              </div>
            </div>

            {item.validationNotes?.length ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Notas de validação
                </p>
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-950">
                  {item.validationNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="break-all text-[11px] text-muted-foreground">
              SHA-256: {item.contentSha256}
            </p>
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 border-t border-border/60 bg-muted/15 px-5 py-3 sm:flex-col sm:space-x-0">
          {confirmDelete ? (
            <div className="flex w-full flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-950">
                Apagar esta importação? O resumo deixa de aparecer na lista (o XML nunca foi
                arquivado).
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                  disabled={removing}
                >
                  Não
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => void remove()}
                  disabled={removing}
                >
                  {removing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A apagar…
                    </>
                  ) : (
                    'Sim, apagar'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              onClick={() => setConfirmDelete(true)}
              disabled={removing}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Apagar importação
            </Button>
          )}

          <div className="flex w-full justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={removing}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words font-medium leading-snug">{value}</dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  )
}
