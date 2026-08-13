import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

const buttonBaseClassTokens = [
  'inline-flex',
  'items-center',
  'justify-center',
  'gap-2',
  'whitespace-nowrap',
  'rounded-lg',
  'text-sm',
  'font-semibold',
  'transition-colors',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-ring/40',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-background',
  'disabled:pointer-events-none',
  'disabled:opacity-50',
  '[&_svg]:pointer-events-none',
  '[&_svg]:size-4',
  '[&_svg]:shrink-0',
]

const buttonVariants = cva(buttonBaseClassTokens.join(' '), {
  variants: {
    variant: {
      /** Alias oficial Teglion — CTA principal */
      primary: 'bg-brand text-primary-foreground shadow-sm hover:bg-brand-hover active:scale-[0.99]',
      default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
      brand: 'bg-brand text-primary-foreground shadow-sm hover:bg-brand-hover active:scale-[0.99]',
      secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
      outline:
        'border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      /** Alias oficial Teglion */
      danger: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
      destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
      link: 'text-primary underline-offset-4 hover:underline',
    },
    size: {
      sm: 'h-8 rounded-md px-3 text-xs',
      /** Alias md */
      md: 'h-10 px-4 py-2',
      default: 'h-10 px-4 py-2',
      lg: 'h-11 rounded-lg px-8',
      icon: 'h-10 w-10',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Mostra spinner e desactiva o botão */
  loading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button'
    const isDisabled = Boolean(disabled || loading)
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        ref={ref}
        disabled={asChild ? undefined : isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
