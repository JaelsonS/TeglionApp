import { Bell, Smartphone } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  detectPushPlatform,
  getPermissionDeniedGuide,
  getPushInstallGuide,
  needsPwaInstallForPush,
  type PushSetupIssue,
} from '@/shared/utils/pushSetup'

type ClientPushSetupGuideProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  issue: PushSetupIssue | 'guide'
  onRetry?: () => void
  retrying?: boolean
}

export function ClientPushSetupGuide({
  open,
  onOpenChange,
  issue,
  onRetry,
  retrying = false,
}: ClientPushSetupGuideProps) {
  const platform = detectPushPlatform()
  const installSteps = getPushInstallGuide(platform)
  const permissionSteps = getPermissionDeniedGuide(platform)
  const showInstall = issue === 'needs_install' || issue === 'guide' || needsPwaInstallForPush()
  const showPermission = issue === 'permission_denied'
  const steps = showPermission ? permissionSteps : installSteps

  const title = showPermission
    ? 'Active as notificações nas definições'
    : platform === 'ios'
      ? 'Instale o Teglion no iPhone'
      : 'Como receber avisos do escritório'

  const description = showPermission
    ? 'O Teglion precisa da sua permissão para avisar sobre mensagens, obrigações e pedidos do escritório.'
    : platform === 'ios'
      ? 'No iPhone, as notificações só funcionam quando abre o portal pela app instalada no ecrã inicial — não pelo Safari normal.'
      : 'Para receber avisos mesmo com a app fechada, instale o Teglion e permita notificações neste dispositivo.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            {showInstall ? (
              <Smartphone className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            ) : (
              <Bell className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="mt-0.5 text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        {showInstall && platform === 'ios' ? (
          <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Depois de instalar, abra o Teglion pelo ícone no ecrã inicial e volte a tocar em «Activar».
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onRetry ? (
            <Button
              type="button"
              className="rounded-full"
              disabled={retrying || (showInstall && needsPwaInstallForPush())}
              onClick={() => onRetry()}
            >
              {retrying ? 'A activar…' : 'Activar notificações'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
