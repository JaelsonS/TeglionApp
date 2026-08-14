import { BrandMark } from '@/shared/components/brand/BrandMark'
import { cn } from '@/shared/lib/utils'

type AuthHeaderProps = {
    title: string
    subtitle?: string
    description?: string
    className?: string
    /** Quando o layout já mostra o Teglion, omitir o BrandMark duplicado. */
    showBrand?: boolean
    /** Título mais compacto (ex.: dentro de AuthCard no fluxo de registo). */
    compact?: boolean
}

export function AuthHeader({
    title,
    subtitle,
    description,
    className,
    showBrand = true,
    compact = false,
}: AuthHeaderProps) {
    return (
        <div className={cn(compact ? 'space-y-2' : 'space-y-4', className)}>
            {showBrand ? (
                <div className="inline-flex items-center gap-3 rounded-3xl border border-[#0f2942]/10 bg-[#0f2942]/5 px-4 py-2">
                    <BrandMark size="md" variant="onLight" showName />
                </div>
            ) : null}
            <div className="space-y-2">
                <h1
                    className={cn(
                        'font-semibold tracking-tight text-slate-950',
                        compact
                            ? 'text-2xl sm:text-[1.65rem] sm:leading-snug'
                            : 'text-4xl sm:text-[2.6rem] sm:leading-[1.08]',
                    )}
                >
                    {title}
                </h1>
                {subtitle ? <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p> : null}
                {description ? <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
            </div>
        </div>
    )
}
