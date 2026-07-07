import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { releaseBodyScrollLock } from "@/shared/utils/releaseBodyScrollLock"

const dialogOverlayClassTokens = [
  "fixed", "inset-0", "z-50", "bg-slate-900/50", "backdrop-blur-sm",
  "data-[state=open]:animate-in", "data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0", "data-[state=open]:fade-in-0",
  "data-[state=closed]:pointer-events-none", "data-[state=closed]:opacity-0",
]

const dialogContentClassTokens = [
  "fixed", "left-[50%]", "top-[50%]", "z-50", "flex", "max-h-[min(90dvh,calc(100dvh-2rem))]", "w-full", "max-w-lg",
  "flex-col", "overflow-y-auto", "overscroll-y-contain", "[-webkit-overflow-scrolling:touch]",
  "translate-x-[-50%]", "translate-y-[-50%]", "gap-6", "border", "border-border/70",
  "bg-background", "p-6", "shadow-xl", "duration-200", "data-[state=open]:animate-in",
  "data-[state=closed]:animate-out", "data-[state=closed]:fade-out-0", "data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95", "data-[state=open]:zoom-in-95",
  "data-[state=closed]:slide-out-to-left-1/2", "data-[state=closed]:slide-out-to-top-[48%]",
  "data-[state=open]:slide-in-from-left-1/2", "data-[state=open]:slide-in-from-top-[48%]", "sm:rounded-2xl",
]

const Dialog = ({ open, onOpenChange, ...props }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : uncontrolledOpen

  const handleOpenChange = (nextOpen) => {
    if (!isControlled) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <DialogPrimitive.Root open={currentOpen} onOpenChange={handleOpenChange} {...props} />
  )
}

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      dialogOverlayClassTokens.join(" "),
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, onOpenAutoFocus, onCloseAutoFocus, ...props }, ref) => {
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
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={undefined}
        onOpenAutoFocus={handleOpenAutoFocus}
        onCloseAutoFocus={handleCloseAutoFocus}
        className={cn(
          dialogContentClassTokens.join(" "),
          className
        )}
        {...props}>
        {children}
        <DialogPrimitive.Close
          ref={closeRef}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full opacity-80 ring-offset-background transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
