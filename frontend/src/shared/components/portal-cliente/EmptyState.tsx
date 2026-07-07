import type { LucideIcon } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { EmptyState as DsEmptyState } from '@/shared/design-system/EmptyState'

/** Compatível com API legada do portal — delega visual ao design system. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <DsEmptyState
      icon={Icon}
      title={title}
      description={description}
      action={
        action ? (
          <Button type="button" className="rounded-[10px]" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : undefined
      }
    />
  )
}
