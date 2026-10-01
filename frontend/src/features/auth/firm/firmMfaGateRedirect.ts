import type { NavigateFunction } from 'react-router-dom'

import { setMfaChallengeToken } from '@/shared/security/mfaChallengeStore'

type MfaGateResponse = {
  status?: string
  mfa?: {
    challengeToken?: string
    expiresAt?: string | null
  }
}

type RedirectOptions = {
  /** Registo novo escritório — copy específica no ecrã MFA. */
  fromRegistration?: boolean
}

/** Após login/registo: redirecciona para MFA antes de entrar na app. */
export function redirectFirmMfaGateIfNeeded(
  res: MfaGateResponse,
  navigate: NavigateFunction,
  options?: RedirectOptions,
): boolean {
  if (res.status !== 'MFA_CHALLENGE_REQUIRED' && res.status !== 'MFA_ENROLLMENT_REQUIRED') {
    return false
  }
  if (res.mfa?.challengeToken) {
    setMfaChallengeToken(res.mfa.challengeToken, res.mfa.expiresAt ?? null)
  }
  const reason = res.status === 'MFA_ENROLLMENT_REQUIRED' ? 'enroll' : 'challenge'
  const params = new URLSearchParams({ reason })
  if (options?.fromRegistration) params.set('flow', 'register')
  navigate(`/auth/firm/mfa?${params.toString()}`, {
    replace: true,
    state: {
      mfaChallengeToken: res.mfa?.challengeToken ?? null,
      mfaExpiresAt: res.mfa?.expiresAt ?? null,
    },
  })
  return true
}
