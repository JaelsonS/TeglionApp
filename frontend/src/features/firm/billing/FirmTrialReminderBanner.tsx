import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, Sparkles, X } from 'lucide-react'

import {
  canDismissTrialBanner,
  formatTrialEndPt,
  trialBannerDismissStorageKey,
  trialBannerMessage,
  trialBannerTone,
  trialDaysRemaining,
} from '@/features/firm/billing/trialReminderUtils'
import { useAuth } from '@/shared/hooks/useAuth'
import { useFirmAccess } from '@/shared/hooks/useFirmAccess'
import { whatsappSupportUrl } from '@/shared/config/supportLinks'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'

function isFirmOwner(firmRole: string | undefined | null, role: string | undefined | null) {
  return firmRole === 'FIRM_OWNER' || role === 'FIRM_OWNER'
}

export function FirmTrialReminderBanner() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { status, trialEndsAt, isLoading } = useFirmAccess(Boolean(user?.firmId))

  const firmId = user?.firmId || ''
  const trialIso = trialEndsAt?.toISOString() || ''
  const dismissKey = firmId && trialIso ? trialBannerDismissStorageKey(firmId, trialIso) : ''

  const [dismissed, setDismissed] = useState(() => {
    if (!dismissKey) return false
    try {
      return localStorage.getItem(dismissKey) === '1'
    } catch {
      return false
    }
  })

  const model = useMemo(() => {
    if (!trialEndsAt || status !== 'TRIAL') return null
    const daysLeft = trialDaysRemaining(trialEndsAt)
    if (daysLeft <= 0) return null
    return {
      daysLeft,
      tone: trialBannerTone(daysLeft),
      endLabel: formatTrialEndPt(trialEndsAt),
      message: trialBannerMessage(daysLeft, formatTrialEndPt(trialEndsAt)),
      dismissible: canDismissTrialBanner(daysLeft),
    }
  }, [status, trialEndsAt])

  if (isLoading || !user || !isFirmOwner(user.firmRole, user.role)) return null
  if (pathname.startsWith('/app/firm/billing')) return null
  if (!model) return null
  if (model.dismissible && dismissed) return null

  const waUrl = whatsappSupportUrl(
    `Olá, sou dono(a) do escritório no Teglion. Faltam ${model.daysLeft} dias de teste — quero ajuda para activar o plano.`,
  )

  const toneClass =
    model.tone === 'critical'
      ? 'border-red-200/90 bg-red-50/95 text-red-950'
      : model.tone === 'warning'
        ? 'border-amber-200/90 bg-amber-50/95 text-amber-950'
        : 'border-sky-200/80 bg-sky-50/90 text-sky-950'

  function dismiss() {
    if (!dismissKey) return
    try {
      localStorage.setItem(dismissKey, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      className={cn('relative border-b px-3 py-2.5 sm:px-4', toneClass)}
      role="status"
      data-testid="firm-trial-reminder-banner"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2 pr-6 sm:pr-0">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 opacity-80" aria-hidden />
          <p className="text-sm leading-snug">
            <span className="font-semibold">Teste gratuito · </span>
            {model.message}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
          <Button asChild size="sm" className="h-8 rounded-full">
            <Link to="/app/firm/billing">Ver planos</Link>
          </Button>
          {waUrl ? (
            <Button asChild size="sm" variant="outline" className="h-8 rounded-full bg-white/60">
              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                WhatsApp
              </a>
            </Button>
          ) : null}
          {model.dismissible ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 h-8 w-8 rounded-full sm:static"
              aria-label="Ocultar aviso do teste gratuito"
              onClick={dismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
