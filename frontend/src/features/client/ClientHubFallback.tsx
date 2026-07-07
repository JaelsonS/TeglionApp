import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

type Props = {
  onRetry: () => void
  retrying?: boolean
}

/** Fallback quando o hub falha — a página nunca fica em branco. */
export function ClientHubFallback({ onRetry, retrying }: Props) {
  return (
    <div className="cb-feedback-banner-warning cb-empty-state p-8">
      <AlertCircle className="mx-auto h-10 w-10 text-amber-700" />
      <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
        Não foi possível carregar os seus dados
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        A ligação ao escritório está temporariamente indisponível. Pode tentar de novo — as outras áreas do portal
        continuam disponíveis.
      </p>
      <Button type="button" className="cb-btn-primary mt-6" disabled={retrying} onClick={onRetry}>
        <RefreshCw className={cn('mr-2 h-4 w-4', retrying && 'animate-spin')} />
        {retrying ? 'A carregar…' : 'Tentar novamente'}
      </Button>
    </div>
  )
}
