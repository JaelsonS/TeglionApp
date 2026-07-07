import { BrandMark } from '@/shared/components/brand/BrandMark'
import { cn } from '@/shared/lib/utils'

type AuthHeaderProps = {
    title: string
    subtitle?: string
    description?: string
    className?: string
}

export function AuthHeader({ title, subtitle, description, className }: AuthHeaderProps) {
    return (
        <div className={cn('space-y-4', className)}>
            <div className="inline-flex items-center gap-3 rounded-3xl border border-[#0f2942]/10 bg-[#0f2942]/5 px-4 py-2">
                <BrandMark size="md" variant="onLight" showName />
            </div>
            <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-[2.6rem] sm:leading-[1.08]">{title}</h1>
                {subtitle ? <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p> : null}
                {description ? <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
            </div>
        </div>
    )
}
