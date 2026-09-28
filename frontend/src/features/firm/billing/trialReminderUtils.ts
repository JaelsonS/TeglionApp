const MS_DAY = 24 * 60 * 60 * 1000

export type TrialBannerTone = 'neutral' | 'warning' | 'critical'

/** Dias civis até ao fim do teste (inclusivo do último dia). */
export function trialDaysRemaining(trialEndsAt: Date, now = new Date()): number {
  const end = new Date(trialEndsAt)
  if (Number.isNaN(end.getTime())) return 0
  end.setHours(23, 59, 59, 999)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / MS_DAY))
}

export function trialBannerTone(daysLeft: number): TrialBannerTone {
  if (daysLeft <= 1) return 'critical'
  if (daysLeft <= 5) return 'warning'
  return 'neutral'
}

/** Só nos últimos 5 dias o aviso fica sempre visível. */
export function canDismissTrialBanner(daysLeft: number): boolean {
  return daysLeft > 5
}

export function trialBannerDismissStorageKey(firmId: string, trialEndsAtIso: string): string {
  const day = String(trialEndsAtIso || '').slice(0, 10) || 'unknown'
  return `teglion-firm-trial-banner-dismissed:${firmId}:${day}`
}

export function formatTrialEndPt(trialEndsAt: Date): string {
  return trialEndsAt.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function trialBannerMessage(daysLeft: number, endLabel: string): string {
  if (daysLeft === 0) {
    return `O teste gratuito termina hoje (${endLabel}). Active o plano para manter o acesso da equipa e dos clientes.`
  }
  if (daysLeft === 1) {
    return `Falta 1 dia de teste (até ${endLabel}). Active o plano para não interromper o escritório.`
  }
  return `Faltam ${daysLeft} dias de teste gratuito (até ${endLabel}). Pode activar o plano mensal ou anual quando quiser.`
}
