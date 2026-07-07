import { Link } from 'react-router-dom'

import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

const SIZE = {
  sm: 'h-8 w-8 text-[10px] rounded-lg',
  md: 'h-9 w-9 text-xs rounded-xl',
  lg: 'h-10 w-10 text-sm rounded-xl',
} as const

type BrandMarkProps = {
  size?: keyof typeof SIZE
  /** Fundo escuro (painel auth) vs claro (header mobile) */
  variant?: 'onDark' | 'onLight'
  showName?: boolean
  linkToHome?: boolean
  className?: string
  nameClassName?: string
  /** Classes no elemento raiz (Link ou span) */
  wrapperClassName?: string
}

export function BrandMark({
  size = 'md',
  variant = 'onLight',
  showName = false,
  linkToHome = false,
  className,
  nameClassName,
  wrapperClassName,
}: BrandMarkProps) {
  const mark = (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold',
        SIZE[size],
        variant === 'onDark'
          ? 'bg-white/10 text-[#C9932E] ring-1 ring-white/20'
          : 'text-[#C9932E]',
        variant === 'onLight' && 'bg-[#0F2942]',
        className,
      )}
      aria-hidden={!showName}
    >
      {BRAND.initials}
    </span>
  )

  const label = showName ? (
    <span
      className={cn(
        'font-semibold tracking-tight',
        variant === 'onDark' ? 'text-white' : 'text-[#0F2942]',
        nameClassName,
      )}
    >
      {BRAND.name}
    </span>
  ) : null

  const content = (
    <>
      {mark}
      {label}
    </>
  )

  if (linkToHome) {
    return (
      <Link to="/" className={cn('inline-flex items-center gap-2.5', wrapperClassName)}>
        {content}
      </Link>
    )
  }

  if (showName) {
    return <span className={cn('inline-flex items-center gap-2.5', wrapperClassName)}>{content}</span>
  }

  return mark
}
