import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva } from "class-variance-authority";
import { X } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { releaseBodyScrollLock } from "@/shared/utils/releaseBodyScrollLock"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const sheetOverlayClassTokens = [
  'fixed',
  'inset-0',
  'z-50',
  'bg-foreground/40',
  'data-[state=open]:animate-in',
  'data-[state=closed]:animate-out',
  'data-[state=closed]:fade-out-0',
  'data-[state=open]:fade-in-0',
  'data-[state=closed]:pointer-events-none',
  'data-[state=closed]:hidden',
]

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(sheetOverlayClassTokens.join(' '), className)}
    {...props}
    ref={ref} />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  [
    'fixed',
    'z-50',
    'gap-4',
    'bg-background',
    'p-6',
    'shadow-lg',
    'transition',
    'ease-in-out',
    'data-[state=open]:animate-in',
    'data-[state=closed]:hidden',
    'data-[state=closed]:pointer-events-none',
  ].join(' '),
  {
    variants: {
      side: {
        top: ['inset-x-0', 'top-0', 'border-b', 'data-[state=open]:slide-in-from-top'].join(' '),
        bottom: ['inset-x-0', 'bottom-0', 'border-t', 'data-[state=open]:slide-in-from-bottom'].join(' '),
        left: ['inset-y-0', 'left-0', 'h-[100dvh]', 'max-h-[100dvh]', 'w-3/4', 'border-r', 'flex', 'min-h-0', 'flex-col', 'overflow-hidden', 'pb-[env(safe-area-inset-bottom)]', 'data-[state=open]:slide-in-from-left', 'sm:max-w-sm'].join(' '),
        right: ['inset-y-0', 'right-0', 'h-[100dvh]', 'max-h-[100dvh]', 'w-full', 'border-l', 'flex', 'min-h-0', 'flex-col', 'overflow-hidden', 'pb-[env(safe-area-inset-bottom)]', 'data-[state=open]:slide-in-from-right', 'sm:max-w-md', 'lg:max-w-lg'].join(' '),
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

const SheetContent = React.forwardRef(({ side = "right", className, children, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
  const closeRef = React.useRef(null)

  const handleOpenAutoFocus = (event) => {
    onOpenAutoFocus?.(event)
    if (!event.defaultPrevented) {
      closeRef.current?.focus()
    }
  }

  const handleCloseAutoFocus = (event) => {
    onCloseAutoFocus?.(event)
    if (!event.defaultPrevented) {
      const active = document.activeElement
      if (active && typeof active.blur === 'function') active.blur()
    }
    requestAnimationFrame(() => releaseBodyScrollLock())
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        className={cn(sheetVariants({ side }), className)}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        {...props}
      >
        <SheetPrimitive.Close
          ref={closeRef}
          className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </SheetPrimitive.Close>
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props} />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props} />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
