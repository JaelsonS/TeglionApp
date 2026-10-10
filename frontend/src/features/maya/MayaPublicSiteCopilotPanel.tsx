import { useQuery } from '@tanstack/react-query'

import { MayaPublicSiteCopilotChat } from '@/features/firm/public-site/MayaPublicSiteCopilotChat'
import { mayaSetupApi } from '@/infrastructure/api/contabil/mayaSetup'

type Props = {
  countryCode?: 'PT' | 'BR'
}

/**
 * Copilot com advise IA — só montado dentro de AuthenticatedAppShell (QueryClient).
 * Evita useQuery na landing comercial, onde não há QueryClientProvider.
 */
export function MayaPublicSiteCopilotPanel({ countryCode = 'PT' }: Props) {
  const capabilitiesQuery = useQuery({
    queryKey: ['maya-setup-capabilities'],
    queryFn: () => mayaSetupApi.getCapabilities().then((r) => r.capabilities),
    staleTime: 60_000,
  })

  return (
    <div className="border-t border-border/40 pt-3">
      <p className="mb-2 text-[11px] font-medium text-muted-foreground">
        Dúvida rápida sobre esta página?
      </p>
      <MayaPublicSiteCopilotChat
        embedded
        setupStep="public-site-coach"
        countryCode={countryCode}
        aiAdviseEnabled={capabilitiesQuery.data?.aiSetup === true}
      />
    </div>
  )
}
