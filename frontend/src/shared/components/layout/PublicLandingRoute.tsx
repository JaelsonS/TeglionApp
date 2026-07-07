import { lazy, Suspense } from 'react'

const LandingPage = lazy(() =>
  import('@/shared/components/landing/LandingPage').then((m) => ({ default: m.LandingPage })),
)

export function PublicLandingRoute() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  )
}
