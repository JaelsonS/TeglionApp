import { CalendarRange, CheckCircle2, Loader2, Settings2, Users } from 'lucide-react'
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
  activeRetainerCount: number
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

export function GenerateMonthDialog({
  open,
  onOpenChange,
  year,
  fromYearMonth,
  toYearMonth,
  onFromYearMonthChange,
  onToYearMonthChange,
  activeRetainerCount,
  generating,
  onGenerate,
}: Props) {
  const canApply =
    activeRetainerCount > 0 && !generating && Boolean(fromYearMonth) && Boolean(toYearMonth)
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
      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="space-y-2 border-b border-border/60 px-5 py-4 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Settings2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <DialogTitle>Configurar mapa de avenças</DialogTitle>
              <DialogDescription className="mt-1">
                Aplica o valor mensal definido em cada cliente a todos os meses do intervalo — de uma
                só vez, para toda a carteira activa. Não é fatura AT; é controlo interno do gabinete.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <ol className="space-y-2.5 text-sm">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                1
              </span>
              <div>
                <p className="font-medium text-foreground">Pré-requisito no cliente</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Valor mensal, dia de vencimento, início/fim e avença activa — no hub do cliente ou
                  no cartão do mapa.
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
                  Ano completo, trimestre, ou intervalo livre. Quem já tem o mês, ou está fora do
                  início/fim da avença, fica de fora.
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
                  Cria rascunhos editáveis. Depois marca pago, confirma ou gera recibo interno célula
                  a célula só quando precisar.
                </p>
              </div>
            </li>
          </ol>

          <div
            className={cn(
              'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm',
              activeRetainerCount > 0
                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                : 'border-amber-200 bg-amber-50 text-amber-950',
            )}
          >
            <Users className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <div>
              {activeRetainerCount > 0 ? (
                <>
                  <p className="font-semibold">
                    {activeRetainerCount} cliente{activeRetainerCount === 1 ? '' : 's'} com avença
                    activa
                  </p>
                  <p className="mt-0.5 text-xs opacity-90">
                    Serão incluídos no intervalo {monthLabel(fromYearMonth)} →{' '}
                    {monthLabel(toYearMonth)}.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Nenhum cliente pronto</p>
                  <p className="mt-0.5 text-xs opacity-90">
                    Abra um cliente, defina valor + início/fim, active a avença e guarde — depois
                    volte aqui.
                  </p>
                </>
              )}
            </div>
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
              Meses já pagos ou confirmados não são alterados. Para copiar um valor específico de um
              cliente para vários meses, abra a célula e use «Replicar para outros meses».
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20 px-5 py-3 sm:justify-between">
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
