import { Building2, CalendarRange, CheckCircle2, Loader2 } from 'lucide-react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  fromYearMonth: string
  toYearMonth: string
  onFromYearMonthChange: (value: string) => void
  onToYearMonthChange: (value: string) => void
  activeLeaseCount: number
  generating: boolean
  onGenerate: () => void
}

type PresetId = 'year' | 'q1' | 'q2' | 'q3' | 'q4' | 'custom'

function quarterRange(year: number, q: 1 | 2 | 3 | 4) {
  const startMonth = (q - 1) * 3 + 1
  const endMonth = startMonth + 2
  return {
    from: `${year}-${String(startMonth).padStart(2, '0')}`,
    to: `${year}-${String(endMonth).padStart(2, '0')}`,
  }
}

function detectPreset(year: number, from: string, to: string): PresetId {
  if (from === `${year}-01` && to === `${year}-12`) return 'year'
  for (const q of [1, 2, 3, 4] as const) {
    const r = quarterRange(year, q)
    if (from === r.from && to === r.to) return `q${q}` as PresetId
  }
  return 'custom'
}

function monthLabel(ym: string) {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym || '—'
  const [y, m] = ym.split('-')
  const names = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]
  return `${names[Number(m) - 1] || m} ${y}`
}

export function GenerateRentReceiptsDialog({
  open,
  onOpenChange,
  year,
  fromYearMonth,
  toYearMonth,
  onFromYearMonthChange,
  onToYearMonthChange,
  activeLeaseCount,
  generating,
  onGenerate,
}: Props) {
  const canApply =
    activeLeaseCount > 0 && !generating && Boolean(fromYearMonth) && Boolean(toYearMonth)
  const preset = detectPreset(year, fromYearMonth, toYearMonth)

  function applyPreset(id: PresetId) {
    if (id === 'year') {
      onFromYearMonthChange(`${year}-01`)
      onToYearMonthChange(`${year}-12`)
      return
    }
    if (id === 'q1' || id === 'q2' || id === 'q3' || id === 'q4') {
      const q = Number(id.slice(1)) as 1 | 2 | 3 | 4
      const r = quarterRange(year, q)
      onFromYearMonthChange(r.from)
      onToYearMonthChange(r.to)
    }
  }

  const presets: { id: PresetId; label: string }[] = [
    { id: 'year', label: `Ano ${year}` },
    { id: 'q1', label: '1.º trim.' },
    { id: 'q2', label: '2.º trim.' },
    { id: 'q3', label: '3.º trim.' },
    { id: 'q4', label: '4.º trim.' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-2rem))] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 px-5 py-4 text-left pr-12">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle>Configurar mapa de custos</DialogTitle>
              <DialogDescription className="mt-1">
                Lança no mapa os valores mensais dos contratos activos do gabinete (renda, luz, gás,
                água, software…) para o período escolhido. Controlo interno — não substitui o Portal
                das Finanças.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-5 py-4">
          <ol className="space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                1
              </span>
              <div>
                <p className="font-medium text-foreground">Contratos activos</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Cada custo/contrato com valor mensal e datas válidas entra no mapa.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                2
              </span>
              <div>
                <p className="font-medium text-foreground">Escolha o período</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Ano, trimestre ou intervalo livre. Meses que já existem ficam de fora.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                3
              </span>
              <div>
                <p className="font-medium text-foreground">Aplicar ao mapa</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Cria rascunhos. Depois marca pago ou edita célula a célula.
                </p>
              </div>
            </li>
          </ol>

          <div
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm',
              activeLeaseCount > 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                : 'border-amber-200 bg-amber-50 text-amber-950',
            )}
          >
            {activeLeaseCount > 0 ? (
              <>
                <p className="font-semibold">
                  {activeLeaseCount} contrato{activeLeaseCount === 1 ? '' : 's'} activo
                  {activeLeaseCount === 1 ? '' : 's'}
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  Incluídos: {monthLabel(fromYearMonth)} → {monthLabel(toYearMonth)}.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Ainda sem contratos activos</p>
                <p className="mt-0.5 text-xs opacity-90">
                  Crie um custo/contrato (renda, luz, etc.) e active-o antes de aplicar o mapa.
                </p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Período rápido</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Atalhos de período">
              {presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={generating}
                  onClick={() => applyPreset(p.id)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
                    preset === p.id
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">De</span>
              <Input
                type="month"
                value={fromYearMonth}
                onChange={(e: FormChangeEvent) => onFromYearMonthChange(e.target.value)}
                disabled={generating}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Até</span>
              <Input
                type="month"
                value={toYearMonth}
                onChange={(e: FormChangeEvent) => onToYearMonthChange(e.target.value)}
                disabled={generating}
              />
            </label>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <CalendarRange className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              Isto preenche o mapa interno do gabinete. Não comunica à AT nem substitui o recibo
              oficial do senhorio ou do fornecedor.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/60 bg-muted/20 px-5 py-3 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onGenerate} disabled={!canApply}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A aplicar…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                Aplicar ao mapa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
