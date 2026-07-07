import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'

export type FirmSplitViewProps = {
  /** Item selecionado — controla stack mobile e sheet tablet */
  hasSelection: boolean
  onClearSelection: () => void
  list: ReactNode
  detail: ReactNode
  /** Filtros / KPIs acima do split (opcional) */
  toolbar?: ReactNode
  sheetTitle?: string
  className?: string
  listClassName?: string
  detailClassName?: string
}

/**
 * Lista → detalhe responsivo (escritório):
 * - desktop (≥1280px): duas colunas fixas
 * - tablet (768–1279px): lista + sheet
 * - mobile (&lt;768px): stack com voltar
 */
function useSplitTabletViewport() {
  const query = '(min-width: 768px) and (max-width: 1279px)'
  const [tablet, setTablet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setTablet(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return tablet
}

export function FirmSplitView({
  hasSelection,
  onClearSelection,
  list,
  detail,
  toolbar,
  sheetTitle = 'Detalhe',
  className,
  listClassName,
  detailClassName,
}: FirmSplitViewProps) {
  const sheetOpen = hasSelection && useSplitTabletViewport()

  return (
    <div className={cn('cb-firm-split-view', className)} data-testid="firm-split-view">
      {toolbar ? <div className="cb-firm-split-toolbar">{toolbar}</div> : null}

      {/* Desktop */}
      <div className="cb-firm-split-desktop" aria-label="Lista e detalhe">
        <div className={cn('cb-firm-split-list', listClassName)}>{list}</div>
        <div className={cn('cb-firm-split-detail', detailClassName)}>{detail}</div>
      </div>

      {/* Mobile — stack */}
      <div className="cb-firm-split-mobile" aria-label="Lista ou detalhe">
        {!hasSelection ? (
          <div className="cb-firm-split-mobile-list">{list}</div>
        ) : (
          <div className="cb-firm-split-mobile-detail">
            <div className="cb-firm-split-mobile-back">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-xs"
                onClick={onClearSelection}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar à lista
              </Button>
            </div>
            <div className="cb-firm-split-mobile-detail-body">{detail}</div>
          </div>
        )}
      </div>

      {/* Tablet — lista + sheet */}
      <div className="cb-firm-split-tablet" aria-label="Lista">
        <div className="cb-firm-split-tablet-list">{list}</div>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open: boolean) => {
          if (!open) onClearSelection()
        }}
      >
        <SheetContent side="right" className="cb-firm-split-sheet flex w-full flex-col p-0 sm:max-w-lg">
          <SheetHeader className="shrink-0 border-b border-border/60 px-4 py-3 text-left">
            <SheetTitle className="text-base font-semibold">{sheetTitle}</SheetTitle>
          </SheetHeader>
          <div className="cb-firm-split-sheet-body">{detail}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
