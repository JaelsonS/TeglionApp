import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type Props = {
  sectionKey: string
  zone: string
  highlight?: boolean
  children: ReactNode
}

/** Envolve secções do template default com metadados para preview do editor. */
export function PublicSitePreviewZone({ sectionKey, zone, highlight, children }: Props) {
  return (
    <div
      data-public-zone={zone}
      data-section-key={sectionKey}
      data-preview-highlight={highlight ? 'true' : undefined}
      className={cn(highlight && 'cb-public-site-preview-zone-highlight')}
    >
      {children}
    </div>
  )
}
