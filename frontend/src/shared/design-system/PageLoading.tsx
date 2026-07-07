import { Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export function PageLoading({ label = 'A carregar…', className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground', className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
