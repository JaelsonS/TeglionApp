/**
 * Traduz códigos/motivos Stripe Connect para texto legível em PT.
 * Nunca mostrar `requirements.past_due` ou similar ao utilizador.
 */
export function humanizeConnectDisabledReason(raw: string | null | undefined): string | null {
  if (!raw) return null
  const key = String(raw).trim().toLowerCase()
  if (!key) return null

  const map: Record<string, string> = {
    'requirements.past_due':
      'Ainda faltam dados na Stripe (por exemplo identidade ou conta bancária). Continue a configuração para activar os pagamentos.',
    'requirements.pending_verification':
      'A Stripe está a verificar os dados do escritório. Isto pode demorar um pouco — volte a verificar mais tarde.',
    'rejected.fraud':
      'A Stripe recusou esta conta. Contacte o suporte Stripe ou a Teglion se precisar de ajuda.',
    'rejected.terms_of_service':
      'É preciso aceitar os termos da Stripe para continuar.',
    'rejected.listed':
      'A Stripe bloqueou esta conta. Contacte o suporte Stripe.',
    'rejected.other':
      'A Stripe não conseguiu activar a conta. Abra Pagamentos e continue o processo, ou contacte o suporte.',
    listed: 'A Stripe bloqueou esta conta. Contacte o suporte Stripe.',
    under_review: 'A conta está em revisão na Stripe. Aguarde a confirmação.',
    other: 'Ainda há passos por concluir na Stripe. Abra Pagamentos e continue a configuração.',
  }

  if (map[key]) return map[key]

  // Qualquer código com pontos / snake_case → mensagem genérica (nunca o código cru)
  if (/^[a-z0-9_.]+$/i.test(key) && (key.includes('.') || key.includes('_'))) {
    return 'Ainda falta concluir a configuração na Stripe. Abra Pagamentos e siga os passos indicados.'
  }

  // Texto já humano (frase com espaços)
  if (/\s/.test(String(raw).trim()) && !String(raw).includes('requirements.')) {
    return String(raw).trim()
  }

  return 'Ainda falta concluir a configuração na Stripe. Abra Pagamentos e siga os passos indicados.'
}

export function connectPendingSummary(opts: {
  disabledReason?: string | null
  currentlyDue?: string[] | null
}): string {
  const human = humanizeConnectDisabledReason(opts.disabledReason)
  if (human) return human
  const due = opts.currentlyDue?.filter(Boolean) ?? []
  if (due.length > 0) {
    return 'A Stripe pediu mais algumas informações do escritório. Continue a configuração em Pagamentos — demora só uns minutos.'
  }
  return 'A conta Stripe ainda não está pronta a receber. Continue a configuração em Pagamentos.'
}
