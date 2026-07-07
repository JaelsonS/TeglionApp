import axios from 'axios'
import i18n from '@/i18n'
/**
 * Mensagens amigáveis e consistentes para todo o app.
 * Cobrem: login, cadastro, sessão expirada, campos vazios, endpoints sem dados, rede offline.
 */
const TECHNICAL_MESSAGE =
  /^[A-Z][A-Z0-9_]{2,}$|token (inválido|ausente|expirado)|unauthorized|forbidden|internal server error|request failed with status code/i

function looksTechnicalMessage(value?: string): boolean {
  if (!value?.trim()) return true
  const trimmed = value.trim()
  if (TECHNICAL_MESSAGE.test(trimmed)) return true
  if (/^[A-Z_]+$/.test(trimmed)) return true
  return false
}

export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  const genericFallback = String(i18n.t('common.errors.generic', { defaultValue: 'Unexpected error' }))
  // i18n: uso o dicionário global para manter as mensagens traduzíveis
  const t = (key: string, options?: Record<string, any>) => {
    const fallback = typeof options?.defaultValue === 'string' ? options.defaultValue : genericFallback
    const value = i18n.t(key, { ...options, defaultValue: fallback })
    if (typeof value !== 'string') return fallback
    if (!value.trim()) return fallback
    if (value === key) return fallback
    return value
  }
  const GENERIC_STATUS_SET = new Set([400, 403, 404, 409, 500])
  const friendlyOverrides: Array<{ match: RegExp; message: string }> = [
    { match: /CRYPTO_DECRYPT_FAILED/i, message: t('common.errors.cryptoDecryptFailed') },
    { match: /EMAIL_ALREADY_EXISTS|email já está em uso|email já cadastrado/i, message: t('common.errors.emailConflict') },
    { match: /TOKEN|INTEGRATION TOKEN|token inválido|token ausente/i, message: t('common.errors.invalidToken') },
    { match: /RATE_LIMIT|too many|muitas tentativas/i, message: t('common.errors.rateLimited') },
  ]
  const isGenericMessage = (value?: string) => {
    if (!value) return true
    const lowered = value.toLowerCase().trim()
    if (!lowered) return true
    const statusMatch = lowered.match(/^request failed with status code\s+(\d{3})$/i)
    if (statusMatch) {
      const statusCode = Number(statusMatch[1])
      if (GENERIC_STATUS_SET.has(statusCode)) return true
    }
    return (
      lowered === 'erro na api' ||
      lowered === 'internal server error'
    )
  }
  // Aqui trato erros do Axios para extrair status e mensagem
  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const data = (err.response?.data || {}) as any
    const rawMessage: string | undefined = data?.message || data?.error || data?.details?.message || err.message
    const code = String(data?.code || data?.details?.code || '').toUpperCase()

    // Auth — antes de overrides genéricos (evita confundir lockout com rate limit)
    if (
      code === 'INVALID_CREDENTIALS' ||
      code === 'EMAIL_NOT_FOUND' ||
      code === 'INVALID_PASSWORD'
    ) {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return t('common.errors.invalidCredentials', {
        defaultValue:
          'E-mail ou palavra-passe incorretos. Verifique os dados e tente novamente.',
      })
    }
    if (code === 'ACCOUNT_LOCKED') {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return t('common.errors.accountLocked', {
        defaultValue: 'Muitas tentativas falhadas. Aguarde alguns minutos e tente novamente.',
      })
    }
    if (code === 'WEAK_PASSWORD') {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return t('common.errors.weakPassword', {
        defaultValue: 'A palavra-passe não cumpre os requisitos de segurança.',
      })
    }

    const override = rawMessage
      ? friendlyOverrides.find((item) => item.match.test(rawMessage))
      : undefined
    if (override?.message) return override.message

    // Campos obrigatórios/validação
    if (status === 400) {
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const first = data.errors[0]
        if (first?.msg) return String(first.msg)
        if (first?.message) return String(first.message)
      }
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      // Campos vazios comuns
      if (rawMessage?.toLowerCase().includes('required')) return t('common.errors.requiredFields')
      return rawMessage || t('common.errors.invalidRequest')
    }

    if (status === 422) {
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        const first = data.errors[0]
        if (first?.msg) return String(first.msg)
        if (first?.message) return String(first.message)
      }
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return rawMessage || t('common.errors.invalidRequest')
    }

    // Bugfix: mapeia codigos de autenticacao para mensagens claras.
    if (code === 'DUPLICATE_SLUG') {
      return 'Já existe uma notícia semelhante. Altere o título e volte a guardar.'
    }
    if (code === 'FILE_TOO_LARGE' || status === 413) {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return 'O ficheiro é demasiado grande. Comprima o PDF ou escolha um ficheiro mais pequeno.'
    }
    if (
      code === 'INVALID_FILE_TYPE' ||
      code === 'LIMIT_FILE_SIZE' ||
      /unsupported file|tipo de ficheiro|mimetype|multer/i.test(String(rawMessage || ''))
    ) {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return 'Tipo de ficheiro não permitido. Use PDF, imagem ou documento Office.'
    }
    if (code === 'PASSWORD_NOT_SET') {
      return 'Ainda não tem palavra-passe no portal. Peça ao escritório um link de convite ou use «Primeiro acesso» na página de login.'
    }
    if (code === 'MULTIPLE_FIRMS') {
      return 'Este e-mail está em mais do que um escritório. Use o link de convite que o contabilista lhe enviou.'
    }
    if (code === 'FIRM_NOT_FOUND') return 'Escritório não encontrado. Utilize o link de acesso enviado pelo contabilista.'
    if (code === 'TOKEN_MISSING' || code === 'UNAUTHORIZED' || code === 'BEARER_NOT_ALLOWED') {
      return t('common.errors.sessionExpired')
    }
    if (code === 'SSO_DISABLED' || code === 'SSO_FAILED') {
      return 'Login com Google indisponível. Tente com e-mail e palavra-passe ou contacte o suporte.'
    }
    if (code === 'ACCOUNT_INACTIVE') return t('common.errors.accountInactive')
    if (code === 'TRIAL_EXPIRED') {
      return 'O período de teste terminou. Active o plano ou contacte o suporte TegLion para continuar.'
    }
    if (code === 'FIRM_CANCELLED') {
      return 'Esta conta de escritório foi encerrada. Contacte o suporte TegLion se precisar de reactivação.'
    }
    if (code === 'SUSPENDED' || code === 'FIRM_BLOCKED') {
      return 'Acesso suspenso. Regularize o pagamento ou contacte o suporte TegLion.'
    }

    const lowered = (rawMessage || '').toLowerCase()
    if (
      lowered.includes('e-mail ou palavra-passe incorretos') ||
      lowered.includes('email ou palavra-passe incorretos')
    ) {
      return t('common.errors.invalidCredentials', {
        defaultValue:
          'E-mail ou palavra-passe incorretos. Verifique os dados e tente novamente.',
      })
    }

    // Não autenticado / sessão expirada
    if (status === 401) {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return t('common.errors.sessionExpired')
    }

    // Sem permissão / CSRF
    if (status === 403) {
      if (code === 'CSRF_INVALID')
        return t('common.errors.csrfBlocked', {
          defaultValue: 'Pedido bloqueado por segurança. Actualize a página e volte a tentar (no telemóvel pode ser preciso refrescar duas vezes).',
        })
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return t('common.errors.forbidden')
    }

    // Cooldown / rate limit
    if (status === 429) {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return t('common.errors.rateLimited')
    }

    // Conflito (ex.: email já cadastrado)
    if (status === 409) {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      if (rawMessage?.toLowerCase().includes('email')) {
        return t('common.errors.emailConflict')
      }
      return t('common.errors.dataConflict')
    }

    // Não encontrado / sem dados
    if (status === 404) {
      if (data?.message && !isGenericMessage(data.message)) return String(data.message)
      return t('common.errors.noRecords')
    }

    // Casos comuns de login — mensagem genérica (evita revelar se o e-mail existe)
    if (
      lowered.includes('user not found') ||
      lowered.includes('usuario nao encontrado') ||
      lowered.includes('invalid credentials') ||
      lowered.includes('senha incorreta') ||
      lowered.includes('wrong password') ||
      lowered.includes('email inexistente') ||
      lowered.includes('email nao cadastrado')
    ) {
      return t('common.errors.invalidCredentials', {
        defaultValue:
          'E-mail ou palavra-passe incorretos. Verifique os dados e tente novamente.',
      })
    }

    // Falha de rede/backend
    if (
      err.code === 'ECONNABORTED' ||
      err.code === 'ERR_NETWORK' ||
      err.message?.includes('Network Error')
    ) {
      return 'Não foi possível ligar ao servidor. Verifique a ligação e tente novamente.'
    }

    if (status) {
      return t('common.errors.statusFallback', {
        defaultValue: 'Não foi possível concluir o pedido. Tente novamente.',
      })
    }
    if (rawMessage && !isGenericMessage(rawMessage) && !looksTechnicalMessage(rawMessage)) return rawMessage
  }

  if (err instanceof Error) {
    if (!looksTechnicalMessage(err.message)) return err.message
  }
  return t('common.errors.generic')
}

export function isRefreshTokenMissingError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false
  const data = (err.response?.data || {}) as { code?: string; message?: string }
  const code = String(data?.code || '').toUpperCase()
  if (code === 'REFRESH_TOKEN_MISSING') return true
  const msg = String(data?.message || '').toLowerCase()
  return msg.includes('sessão não encontrada') && err.response?.status === 401
}

/** Escritório sem acesso (trial expirado, conta encerrada, etc.). */
export function isFirmAccessDeniedError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false
  const code = String((err.response?.data as { code?: string })?.code || '').toUpperCase()
  return ['TRIAL_EXPIRED', 'FIRM_CANCELLED', 'CANCELLED', 'SUSPENDED', 'FIRM_BLOCKED', 'BLOCKED'].includes(code)
}

/** Erros transitórios no arranque da sessão — não devem apagar token/cookies. */
export function isRecoverableBootstrapError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false
  if (isFirmAccessDeniedError(err)) return false
  if (isRefreshTokenMissingError(err)) return true
  if (!err.response) return true
  const status = err.response.status
  return status >= 500 || status === 429
}
