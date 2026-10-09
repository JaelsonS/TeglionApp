import { SafeImage } from '@/shared/components/ui/SafeImage'
import { cn } from '@/shared/lib/utils'

export const MAYA_AVATAR_SM = '/maya/maya-avatar-sm.png'
export const MAYA_AVATAR_MD = '/maya/maya-avatar.png'

const SIZE = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
} as const

type Props = {
  size?: keyof typeof SIZE
  /** Retrato maior no diálogo */
  variant?: 'sm' | 'md'
  className?: string
  ring?: boolean
}

export function MayaAvatar({ size = 'sm', variant = 'sm', className, ring = true }: Props) {
  const src = variant === 'md' ? MAYA_AVATAR_MD : MAYA_AVATAR_SM
  return (
    <SafeImage
      src={src}
      alt=""
      className={cn(
        'shrink-0 rounded-full object-cover',
        SIZE[size],
        ring && 'ring-1 ring-brand/25',
        className,
      )}
    />
  )
}
