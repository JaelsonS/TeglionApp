const STORAGE_PREFIX = 'teglion.vault-stepup.'

export type VaultStepUpPurpose = 'vault_reveal' | 'vault_mutate' | 'vault_import'

type Stored = { token: string; exp: number; purpose: VaultStepUpPurpose }

function keyFor(userId: string, purpose: VaultStepUpPurpose) {
  return `${STORAGE_PREFIX}${userId}.${purpose}`
}

export type VaultUnlockPayload = {
  currentPassword?: string
  stepUpToken?: string
  rememberSession?: boolean
}

export type VaultStepUpResponse = {
  stepUpToken?: string
  stepUpExpiresAt?: string | null
  stepUpPurpose?: string
}

function readRaw(userId: string, purpose: VaultStepUpPurpose): Stored | null {
  try {
    const raw = sessionStorage.getItem(keyFor(userId, purpose))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    if (!parsed?.token || typeof parsed.exp !== 'number') return null
    if (parsed.purpose && parsed.purpose !== purpose) {
      sessionStorage.removeItem(keyFor(userId, purpose))
      return null
    }
    if (parsed.exp * 1000 <= Date.now() + 15_000) {
      sessionStorage.removeItem(keyFor(userId, purpose))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function readVaultStepUpToken(
  userId: string | undefined,
  purpose: VaultStepUpPurpose,
): string | null {
  if (!userId) return null
  return readRaw(userId, purpose)?.token || null
}

export function saveVaultStepUpToken(
  userId: string,
  token: string,
  expiresAt: string,
  purpose: VaultStepUpPurpose,
) {
  const exp = Math.floor(new Date(expiresAt).getTime() / 1000)
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return
  sessionStorage.setItem(
    keyFor(userId, purpose),
    JSON.stringify({ token, exp, purpose } satisfies Stored),
  )
}

export function clearVaultStepUpToken(userId: string | undefined, purpose?: VaultStepUpPurpose) {
  if (!userId) return
  if (purpose) {
    sessionStorage.removeItem(keyFor(userId, purpose))
    return
  }
  for (const p of ['vault_reveal', 'vault_mutate', 'vault_import'] as VaultStepUpPurpose[]) {
    sessionStorage.removeItem(keyFor(userId, p))
  }
  // Legacy single-key from Gate 2 (8h unbound).
  sessionStorage.removeItem(`${STORAGE_PREFIX}${userId}`)
}

export function persistVaultStepUpFromResponse(
  userId: string | undefined,
  data: VaultStepUpResponse | undefined,
  rememberSession: boolean,
  purpose: VaultStepUpPurpose,
) {
  if (!userId) return
  if (rememberSession && data?.stepUpToken && data.stepUpExpiresAt) {
    saveVaultStepUpToken(userId, data.stepUpToken, data.stepUpExpiresAt, purpose)
    return
  }
  if (!rememberSession) clearVaultStepUpToken(userId, purpose)
}

export function vaultUnlockPayload(
  userId: string | undefined,
  purpose: VaultStepUpPurpose,
  password?: string,
  rememberSession = true,
): VaultUnlockPayload {
  const token = !password ? readVaultStepUpToken(userId, purpose) : null
  if (token) return { stepUpToken: token, rememberSession: true }
  return {
    currentPassword: password || undefined,
    rememberSession,
  }
}
