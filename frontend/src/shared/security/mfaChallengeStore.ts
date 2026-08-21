/**
 * Challenge JWT MFA — apenas em memória (não é o segredo TOTP).
 * Cookie httpOnly no backend cobre SSO; este store cobre login password SPA.
 */
let challengeTokenMemory: string | null = null

export function setMfaChallengeToken(token: string | null) {
  challengeTokenMemory = token ? String(token) : null
}

export function getMfaChallengeToken(): string | null {
  return challengeTokenMemory
}

export function clearMfaChallengeToken() {
  challengeTokenMemory = null
}
