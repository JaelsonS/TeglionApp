/**
 * Challenge JWT MFA — memória + sessionStorage (não é o segredo TOTP).
 * Cookie httpOnly no backend cobre SSO; este store cobre login password SPA
 * e sobrevive a refresh acidental na página MFA (≈5 min).
 */
const STORAGE_KEY = 'teglion.mfaChallenge.v1'

let challengeTokenMemory: string | null = null

function readStoredToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string; expiresAt?: string | null }
    const token = String(parsed?.token || '').trim()
    if (!token) return null
    const exp = parsed.expiresAt ? Date.parse(parsed.expiresAt) : NaN
    if (Number.isFinite(exp) && exp <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return token
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null, expiresAt?: string | null) {
  if (typeof sessionStorage === 'undefined') return
  try {
    if (!token) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token, expiresAt: expiresAt || null }),
    )
  } catch {
    // quota / private mode — memória ainda funciona na mesma sessão de tab
  }
}

export function setMfaChallengeToken(token: string | null, expiresAt?: string | null) {
  challengeTokenMemory = token ? String(token) : null
  writeStoredToken(challengeTokenMemory, expiresAt)
}

export function getMfaChallengeToken(): string | null {
  if (challengeTokenMemory) return challengeTokenMemory
  const stored = readStoredToken()
  if (stored) challengeTokenMemory = stored
  return challengeTokenMemory
}

export function clearMfaChallengeToken() {
  challengeTokenMemory = null
  writeStoredToken(null)
}
