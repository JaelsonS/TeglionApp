import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

export function SocialButton({
    href,
    label,
    icon,
    disabled,
    className,
}: {
    href: string
    label: string
    icon: ReactNode
    disabled?: boolean
    className?: string
}) {
    return disabled ? (
        <div
            className={cn(
                'flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500',
                className,
            )}
            aria-disabled
        >
            {icon}
            {label}
        </div>
    ) : (
        <a
            href={href}
            className={cn(
                'group flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition duration-200',
                'hover:border-slate-300 hover:bg-slate-50 hover:shadow-md',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f2942]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                className,
            )}
        >
            {icon}
            <span>{label}</span>
        </a>
    )
}
