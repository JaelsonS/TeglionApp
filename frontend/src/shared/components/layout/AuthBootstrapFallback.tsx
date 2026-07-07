import { BRAND } from '@/shared/config/brand'

/** Ecrã mínimo enquanto valida sessão — sem providers pesados. */
export function AuthBootstrapFallback() {
  return (
    <div
      data-testid="auth-bootstrapping"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-6"
      aria-busy
      aria-label="A validar sessão"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#0f2942]/20 border-t-[#0f2942]"
          aria-hidden
        />
        <div>
          <p className="text-sm font-medium text-foreground">{BRAND.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">A validar sessão…</p>
        </div>
      </div>
    </div>
  )
}
