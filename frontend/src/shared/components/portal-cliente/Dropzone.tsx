import type { ReactNode } from 'react'
import { Upload } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export function Dropzone({
  className,
  children,
  hint = 'Arrasta ficheiros ou clica para selecionar',
  formats = 'PDF, JPG, PNG ou XLSX',
}: {
  className?: string
  children?: ReactNode
  hint?: string
  formats?: string
}) {
  return (
    <div className={cn('pc-dropzone', className)}>
      {children ?? (
        <>
          <Upload className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">{hint}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formats}</p>
        </>
      )}
    </div>
  )
}
