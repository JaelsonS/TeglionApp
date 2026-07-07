import { RiskMeter } from '@/shared/design-system'
import type { ClientHubResponse } from '@/infrastructure/api/contabil/types'

type Props = {
  hub: ClientHubResponse
  clientId: string
  riskReason: string
}

/** KPIs principais estão no header do cockpit; aqui só o detalhe de risco. */
export function ClientHubOverviewMetrics({ hub, riskReason }: Props) {
  return (
    <RiskMeter className="w-full" score={hub.summary.riskScore} reason={riskReason} />
  )
}
