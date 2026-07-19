import { useEffect, useState } from 'react'

import { Skeleton, SkeletonCard } from '@/shared/design-system/Skeleton'
import { ServerWakingScreen } from '@/shared/components/feedback/ServerWakingUp'

/** Só assume "servidor a acordar" se demorar mais do que uma navegação normal entre páginas. */
const WAKE_UP_THRESHOLD_MS = 3500

/** Fallback de rotas lazy — evita ecrã em branco durante code-splitting. */
export function PageRouteFallback() {
  const [showWakingUp, setShowWakingUp] = useState(false)
  const [startedAt] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setTimeout(() => setShowWakingUp(true), WAKE_UP_THRESHOLD_MS)
    return () => window.clearTimeout(id)
  }, [])

  if (showWakingUp) return <ServerWakingScreen startedAt={startedAt} />

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6" aria-busy aria-label="A carregar página">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
