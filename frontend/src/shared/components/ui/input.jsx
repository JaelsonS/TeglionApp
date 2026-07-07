import * as React from "react"

import { cn } from "@/shared/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      // foco mais suave e fundo sólido pra melhorar contraste
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground hover:border-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-card dark:text-foreground dark:placeholder:text-slate-300 sm:h-10 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
