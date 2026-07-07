import * as React from "react"

import { cn } from "@/shared/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      // mesmo visual do input pra manter o sistema consistente
      className={cn(
        "flex min-h-[72px] w-full rounded-md border border-input bg-background/80 px-3 py-2 text-base text-foreground shadow-sm placeholder:text-muted-foreground transition-colors hover:border-muted-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-card dark:text-foreground dark:placeholder:text-slate-300 sm:min-h-[60px] md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
