import { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export function AuthFooter({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('mt-6 text-center text-sm text-slate-500', className)}>{children}</div>
}
