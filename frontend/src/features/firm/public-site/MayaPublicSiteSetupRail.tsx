import { Sparkles, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { MAYA_SETUP_OPEN_EVENT } from '@/features/maya/setup/openMayaSetup'
import { Button } from '@/shared/components/ui/button'

type Props = {
  onScrollToPreview?: () => void
}

export function MayaPublicSiteSetupRail({ onScrollToPreview }: Props) {
  const [, setSearchParams] = useSearchParams()

  function dismiss() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('mayaSetup')
        return next
      },
      { replace: true },
    )
  }

  function focusQuestionnaire() {
    window.dispatchEvent(new CustomEvent(MAYA_SETUP_OPEN_EVENT))
    document.getElementById('maya-inline-setup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section
      className="mb-4 rounded-xl border border-brand/25 bg-brand/[0.04] p-4 shadow-sm"
      data-testid="maya-public-site-setup-rail"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <p className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wide text-brand">
            <Sparkles className="h-4 w-4" aria-hidden />
            Estúdio da página pública
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Três passos: <strong className="font-medium text-foreground">contar</strong> (questionário) →{' '}
            <strong className="font-medium text-foreground">rever</strong> (preview + edição) →{' '}
            <strong className="font-medium text-foreground">publicar</strong>. À esquerda pode{' '}
            <strong className="font-medium text-foreground">perguntar à Maya</strong> — guia incluído; respostas IA
            curtas se o escritório tiver add-on.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" className="shrink-0" onClick={dismiss} aria-label="Fechar painel">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="primary" onClick={focusQuestionnaire}>
          Ir ao passo a passo
        </Button>
        {onScrollToPreview ? (
          <Button type="button" size="sm" variant="outline" onClick={onScrollToPreview}>
            Ver preview
          </Button>
        ) : null}
      </div>
    </section>
  )
}
