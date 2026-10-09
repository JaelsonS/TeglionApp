import { MayaAvatar } from '@/features/maya/MayaAvatar'
import { Button } from '@/shared/components/ui/button'
import { openMayaSetupWizard } from '@/features/maya/setup/openMayaSetup'

type Props = {
  demoOfficeEnabled: boolean
}

/** Modo avançado = editor manual completo; IA opcional via modal ou exemplo AfDigital. */
export function PublicSiteAdvancedModeIntro({ demoOfficeEnabled }: Props) {
  return (
    <section
      className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
      data-testid="public-site-advanced-intro"
    >
      <div className="flex flex-wrap items-start gap-3">
        <MayaAvatar size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Modo avançado — editor completo</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Checklist de publicação, todas as secções, legal e extras. Para gerar rascunho com IA use o assistente
            (modal) — não faz parte deste ecrã. O exemplo AfDigital {demoOfficeEnabled ? 'está disponível' : 'requer ambiente piloto'} em
            modo Simples.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => openMayaSetupWizard()}>
          Configuração IA (modal)
        </Button>
      </div>
    </section>
  )
}
