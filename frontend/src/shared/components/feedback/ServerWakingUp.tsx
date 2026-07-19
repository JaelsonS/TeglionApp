import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

/** Estimativa razoável (Render free tier): ~60s no pior caso. */
const EXPECTED_MAX_SECONDS = 60

function useElapsedSeconds(startedAt?: number) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const start = startedAt ?? Date.now()
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - start) / 1000)))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [startedAt])
  return elapsed
}

/** Aviso inline (banner) — usado em formulários de login/registo. */
export function ServerWakingBanner({ startedAt, className }: { startedAt?: number; className?: string }) {
  const elapsed = useElapsedSeconds(startedAt)
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900',
        className,
      )}
    >
      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden />
      <div>
        <p className="font-medium">A iniciar o servidor…</p>
        <p className="mt-0.5 text-amber-800/80">
          Estávamos inactivos e estamos a acordar o serviço. Pode demorar até {EXPECTED_MAX_SECONDS}s na primeira
          utilização — a tentar automaticamente ({elapsed}s).
        </p>
      </div>
    </div>
  )
}

/** Ecrã inteiro — usado enquanto a app arranca (bootstrap de sessão / rotas). */
export function ServerWakingScreen({ startedAt }: { startedAt?: number }) {
  const elapsed = useElapsedSeconds(startedAt)
  const progress = Math.min(100, Math.round((elapsed / EXPECTED_MAX_SECONDS) * 100))

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF7] px-6 text-center"
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg"
        style={{ backgroundColor: BRAND.colors.navy }}
        aria-hidden
      >
        {BRAND.initials}
      </span>

      <div className="mt-6 flex items-center gap-2 text-[#0F2942]">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <p className="text-lg font-semibold">A iniciar o servidor…</p>
      </div>

      <p className="mt-2 max-w-sm text-sm text-[#4A5568]">
        Estava inactivo e está a acordar. Isto só acontece na primeira visita após um período sem uso — pode demorar
        até {EXPECTED_MAX_SECONDS} segundos.
      </p>

      <div className="mt-6 w-56 overflow-hidden rounded-full bg-[#0F2942]/10">
        <div
          className="h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%`, backgroundColor: BRAND.colors.gold }}
        />
      </div>
      <p className="mt-2 text-xs font-medium tabular-nums text-[#4A5568]">{elapsed}s</p>
    </div>
  )
}
