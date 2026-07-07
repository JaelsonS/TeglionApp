import { Eye, EyeOff } from 'lucide-react'

import {
  normalizeRequestStatus,
  REQUEST_STATUS_CLASS,
  REQUEST_STATUS_LABEL,
  type DocumentRequestStatus,
} from '@/features/firm/documents/documentRequestStatus'
import { Badge } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'

export function DocumentRequestBadge({
  status,
  clientViewedAt,
  compact,
}: {
  status?: DocumentRequestStatus | string | null
  clientViewedAt?: string | null
  compact?: boolean
}) {
  if (!status) return null
  const key = normalizeRequestStatus(status)
  if (!key) return null
  const label = REQUEST_STATUS_LABEL[key] || status
  const seen = Boolean(clientViewedAt) || key === 'seen' || key === 'answered' || key === 'completed'

  return (
    <Badge
      variant="muted"
      className={cn(
        'gap-1 border normal-case',
        REQUEST_STATUS_CLASS[key] || 'bg-muted text-muted-foreground',
        compact && 'px-1.5 py-0 text-[0.6875rem]',
      )}
    >
      {seen ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 opacity-60" />}
      {label}
    </Badge>
  )
}
