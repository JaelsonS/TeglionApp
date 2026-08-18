const STORAGE_PREFIX = 'teglion.vault-stepup.'

type Stored = { token: string; exp: number }

function keyFor(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

export type VaultUnlockPayload = {
  currentPassword?: string
  stepUpToken?: string
  rememberSession?: boolean
}

export type VaultStepUpResponse = {
  stepUpToken?: string
  stepUpExpiresAt?: string | null
}

function readRaw(userId: string): Stored | null {
  try {
    const raw = sessionStorage.getItem(keyFor(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    if (!parsed?.token || typeof parsed.exp !== 'number') return null
    if (parsed.exp * 1000 <= Date.now() + 15_000) {
      sessionStorage.removeItem(keyFor(userId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function readVaultStepUpToken(userId: string | undefined): string | null {
  if (!userId) return null
  return readRaw(userId)?.token || null
}

export function saveVaultStepUpToken(userId: string, token: string, expiresAt: string) {
  const exp = Math.floor(new Date(expiresAt).getTime() / 1000)
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now()) return
  sessionStorage.setItem(keyFor(userId), JSON.stringify({ token, exp } satisfies Stored))
}

export function clearVaultStepUpToken(userId: string | undefined) {
  if (!userId) return
  sessionStorage.removeItem(keyFor(userId))
}

export function persistVaultStepUpFromResponse(
  userId: string | undefined,
  data: VaultStepUpResponse | undefined,
  rememberSession: boolean,
) {
  if (!userId) return
  if (rememberSession && data?.stepUpToken && data.stepUpExpiresAt) {
    saveVaultStepUpToken(userId, data.stepUpToken, data.stepUpExpiresAt)
    return
  }
  if (!rememberSession) clearVaultStepUpToken(userId)
}

export function vaultUnlockPayload(
  userId: string | undefined,
  password?: string,
  rememberSession = true,
): VaultUnlockPayload {
  const token = !password ? readVaultStepUpToken(userId) : null
  if (token) return { stepUpToken: token, rememberSession: true }
  return {
    currentPassword: password || undefined,
    rememberSession,
  }
}
