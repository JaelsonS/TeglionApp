import { SafeImage } from '@/shared/components/ui/SafeImage'
import { Button } from '@/shared/components/ui/button'
import { openMaya } from '@/features/maya/openMaya'
import { setMayaFabVisible } from '@/features/maya/mayaFabPreference'
import { cn } from '@/shared/lib/utils'

type AskMayaButtonProps = {
  /** Intent contextual (ex.: public-page, documents). */
  intentId?: string | null
  className?: string
  /** Se true, volta a mostrar o FAB quando o utilizador pergunta. */
  revealFab?: boolean
}

/**
 * Trigger oficial «? Maya» — substitui Guia / Como funciona no firm.
 */
export function AskMayaButton({ intentId, className, revealFab = true }: AskMayaButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      data-testid="ask-maya-button"
      aria-label="Perguntar a Maya"
      title="Perguntar a Maya"
      onClick={() => {
        if (revealFab) setMayaFabVisible(true)
        openMaya(intentId)
      }}
    >
      <span className="text-sm font-bold leading-none text-brand" aria-hidden>
        ?
      </span>
      <SafeImage
        src="/maya/maya-avatar-sm.png"
        alt=""
        className="h-4 w-4 rounded-full object-cover"
      />
      <span>Maya</span>
    </Button>
  )
}
