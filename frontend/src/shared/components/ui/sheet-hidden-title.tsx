import { SheetTitle } from '@/shared/components/ui/sheet'
import { cn } from '@/shared/lib/utils'

/** Título acessível para Sheet (Radix Dialog) quando o UI não mostra cabeçalho visível. */
export function SheetHiddenTitle({ children, className }: { children: string; className?: string }) {
  return (
    <SheetTitle className={cn('sr-only', className)}>{children}</SheetTitle>
  )
}
