import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

import { BRAND } from '@/shared/config/brand'
import { Button } from '@/shared/components/ui/button'
import { trackProductEvent } from '@/shared/utils/productAnalytics'
import { cn } from '@/shared/lib/utils'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'teglion-pwa-install-dismissed'

function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/.test(ua)
  const notChrome = !/CriOS|FxiOS|EdgiOS/.test(ua)
  return iOS && webkit && notChrome
}

function isStandalone() {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

function isPwaFlagEnabled() {
  const raw = String(import.meta.env.VITE_ENABLE_PWA || '').toLowerCase()
  if (raw === 'false' || raw === '0') return false
  if (raw === 'true' || raw === '1') return true
  return Boolean(import.meta.env.PROD)
}

type Props = {
  surface?: 'client' | 'firm'
  className?: string
  id?: string
}

export function PwaInstallBanner({ surface = 'client', className, id }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [iosHint, setIosHint] = useState(false)

  const enabled = isPwaFlagEnabled()
  const standalone = useMemo(() => isStandalone(), [])
  const showIos = useMemo(() => !standalone && isIosSafari(), [standalone])

  useEffect(() => {
    if (!enabled || standalone || dismissed) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [enabled, standalone, dismissed])

  const dismiss = useCallback(() => {
    setDismissed(true)
    setDeferred(null)
    setIosHint(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    trackProductEvent('pwa_install_dismiss', { surface })
  }, [surface])

  const install = useCallback(async () => {
    if (!deferred) {
      if (showIos) {
        setIosHint(true)
        trackProductEvent('pwa_install_ios_guide', { surface })
      }
      return
    }
    trackProductEvent('pwa_install_prompt', { surface })
    await deferred.prompt()
    const choice = await deferred.userChoice
    trackProductEvent('pwa_install_outcome', { surface, outcome: choice.outcome })
    setDeferred(null)
    if (choice.outcome === 'accepted') dismiss()
  }, [deferred, dismiss, showIos, surface])

  if (!enabled || standalone || dismissed) return null
  if (!deferred && !showIos) return null

  return (
    <div
      id={id}
      className={cn(
        'rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-card p-4 shadow-sm',
        className,
      )}
      role="region"
      aria-label="Instalar aplicação"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Instalar {BRAND.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Acesso rápido no ecrã inicial — como uma app, sem loja.
          </p>
          {iosHint ? (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-foreground">
              <Share className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
              Toque em Partilhar e depois em «Adicionar ao Ecrã Início».
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              onClick={() => void install()}
              aria-label={`Instalar ${BRAND.name}`}
            >
              {showIos && !deferred ? 'Como instalar' : 'Instalar app'}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={dismiss}>
              Agora não
            </Button>
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Fechar"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
