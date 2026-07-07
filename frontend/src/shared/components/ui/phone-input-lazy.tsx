import { lazy, Suspense } from 'react'

import type { ComponentProps } from 'react'

import type { PhoneNumberInput } from '@/shared/components/ui/phone-input'

const PhoneNumberInputLazy = lazy(() =>
  import('@/shared/components/ui/phone-input').then((m) => ({ default: m.PhoneNumberInput })),
)

type Props = ComponentProps<typeof PhoneNumberInput>

export function PhoneNumberInputLazyWrapper(props: Props) {
  return (
    <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted/60" aria-hidden />}>
      <PhoneNumberInputLazy {...props} />
    </Suspense>
  )
}

export type { PhoneInputValue } from '@/shared/components/ui/phone-input'
