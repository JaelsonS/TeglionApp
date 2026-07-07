import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.1)] sm:p-8',
                'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-20 before:bg-gradient-to-b before:from-[#0f2942]/5 before:to-transparent',
                'transition-shadow duration-300 hover:shadow-[0_28px_90px_rgba(15,23,42,0.14)]',
                className,
            )}
        >
            {children}
        </div>
    )
}
