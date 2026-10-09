import { MessageCircle } from 'lucide-react'

import { MayaAvatar } from '@/features/maya/MayaAvatar'
import { Button } from '@/shared/components/ui/button'
import { openMayaForPublicSiteCoach } from '@/features/firm/public-site/publicSiteCoachContext'

type Props = {
  tip: string
  intentId: string
}

/** Faixa compacta — a conversa fica na Maya flutuante / diálogo, não numa coluna extra. */
export function PublicSiteMayaCoachBar({ tip, intentId }: Props) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-gradient-to-r from-brand/[0.06] to-transparent px-3 py-2.5"
      data-testid="public-site-maya-coach-bar"
    >
      <MayaAvatar size="md" className="ring-2 ring-brand/20" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">Maya — assistente da página pública</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{tip}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="primary"
        className="shrink-0 gap-1.5"
        onClick={() => openMayaForPublicSiteCoach(intentId)}
      >
        <MessageCircle className="h-3.5 w-3.5" aria-hidden />
        Abrir Maya
      </Button>
    </div>
  )
}
