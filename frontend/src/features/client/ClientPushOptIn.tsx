import { useState } from 'react'
import { Bell, BellOff, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'

import { ClientPushSetupGuide } from '@/features/client/ClientPushSetupGuide'
import { Button } from '@/shared/components/ui/button'
import { useWebPush } from '@/shared/hooks/useWebPush'
import { PushSetupError, needsPwaInstallForPush } from '@/shared/utils/pushSetup'
import { trackProductEvent } from '@/shared/utils/productAnalytics'

/** Pedido de permissão push no portal do cliente, com guia de instalação PWA. */
export function ClientPushOptIn({ className }: { className?: string }) {
  const { enabled, loading, subscribe, lastIssue } = useWebPush('client')
  const [hidden, setHidden] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideIssue, setGuideIssue] = useState<'guide' | 'needs_install' | 'permission_denied'>('guide')

  if (enabled || hidden) return null

  const openGuide = (issue: typeof guideIssue) => {
    setGuideIssue(issue)
    setGuideOpen(true)
  }

  const onActivate = async () => {
    if (needsPwaInstallForPush()) {
      openGuide('needs_install')
      return
    }

    try {
      const result = await subscribe()
      trackProductEvent('client_push_enabled', { surface: 'client', result })
      toast.success('Notificações activadas', {
        description: 'Vai receber avisos do escritório neste dispositivo.',
      })
    } catch (err) {
      if (err instanceof PushSetupError) {
        if (err.issue === 'needs_install' || err.issue === 'permission_denied') {
          openGuide(err.issue)
          return
        }
        if (err.issue === 'server_not_configured') {
          toast.error('Notificações indisponíveis', { description: err.message })
          return
        }
      }
      toast.error('Não foi possível activar', {
        description: err instanceof Error ? err.message : 'Tente novamente ou siga o guia de instalação.',
        action: {
          label: 'Ver guia',
          onClick: () => openGuide('guide'),
        },
      })
    }
  }

  return (
    <>
      <div
        className={
          className ||
          'flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Avisos do escritório no telemóvel</p>
          <p className="text-xs text-muted-foreground">
            Mensagens, obrigações e pedidos do escritório — mesmo com a app fechada.
            {needsPwaInstallForPush() ? ' No iPhone, instale primeiro no ecrã inicial.' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={loading}
            onClick={() => void onActivate()}
            aria-label="Activar notificações push"
          >
            {loading ? (
              'A activar…'
            ) : (
              <>
                <Bell className="mr-1.5 h-4 w-4" aria-hidden />
                Activar
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => openGuide(needsPwaInstallForPush() ? 'needs_install' : 'guide')}
          >
            <HelpCircle className="mr-1.5 h-4 w-4" aria-hidden />
            Como instalar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => setHidden(true)}
          >
            <BellOff className="mr-1.5 h-4 w-4" aria-hidden />
            Agora não
          </Button>
        </div>
      </div>

      <ClientPushSetupGuide
        open={guideOpen}
        onOpenChange={setGuideOpen}
        issue={lastIssue && lastIssue !== 'unsupported' && lastIssue !== 'server_not_configured' ? lastIssue : guideIssue}
        onRetry={() => void onActivate()}
        retrying={loading}
      />
    </>
  )
}
