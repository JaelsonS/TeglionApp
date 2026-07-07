import { cn } from '@/shared/lib/utils'

export function AuthDivider({ label = 'ou', className }: { label?: string; className?: string }) {
    return (
        <div className={cn('relative py-3 text-center', className)}>
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
            <span className="relative inline-flex bg-white px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                {label}
            </span>
        </div>
    )
}
