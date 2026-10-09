import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { mayaSetupApi } from '@/infrastructure/api/contabil/mayaSetup'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { getErrorMessage } from '@/shared/utils/errors'
import { MAYA_SETUP_APPLIED_EVENT } from '@/features/firm/activation/openActivationAssistant'
import { markMayaSetupAppliedForActivation } from '@/features/firm/activation/activationAssistantPrefs'

type Props = {
  demoOfficeEnabled: boolean
  firmSlug: string
  onAfterSeed?: () => void
  onScrollToPreview?: () => void
}

export function MayaPublicSiteDemoSeedPanel({
  demoOfficeEnabled,
  firmSlug,
  onAfterSeed,
  onScrollToPreview,
}: Props) {
  const queryClient = useQueryClient()
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!demoOfficeEnabled) return null

  async function onSeed() {
    if (!ack || busy) return
    setBusy(true)
    try {
      await mayaSetupApi.seedDemoPublicSite({ includeDemoClients: false })
      if (firmSlug) markMayaSetupAppliedForActivation(firmSlug)
      window.dispatchEvent(new CustomEvent(MAYA_SETUP_APPLIED_EVENT))
      await queryClient.invalidateQueries({ queryKey: ['firm-public-site'] })
      await queryClient.invalidateQueries({ queryKey: ['firm-settings'] })
      await queryClient.invalidateQueries({ queryKey: ['public-firm-services-preview'] })
      toast.success('Exemplo AfDigital aplicado ao rascunho — substitua logo e textos pelos seus.')
      onAfterSeed?.()
      onScrollToPreview?.()
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="rounded-xl border border-dashed border-brand/35 bg-brand/[0.03] p-4"
      data-testid="maya-demo-seed-panel"
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Sparkles className="h-4 w-4 text-brand" aria-hidden />
        Ver exemplo completo (AfDigital)
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        Preenche a página pública, serviços visíveis e horários típicos num{' '}
        <strong className="font-medium text-foreground">rascunho</strong> — não publica. Use imagens de demonstração
        onde configuradas no ambiente; troque logo e fotos pelos seus ficheiros.
      </p>
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-muted-foreground">
        <Checkbox
          checked={ack}
          onCheckedChange={(v: boolean | 'indeterminate') => setAck(v === true)}
          className="mt-0.5"
        />
        <span>
          Entendo que isto é conteúdo de exemplo (não aconselhamento fiscal) e que devo rever tudo antes de publicar.
        </span>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={!ack || busy} onClick={() => void onSeed()}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Maya, prepara tudo num rascunho
        </Button>
      </div>
    </section>
  )
}
