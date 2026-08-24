/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearVaultStepUpToken,
  persistVaultStepUpFromResponse,
  readVaultStepUpToken,
  saveVaultStepUpToken,
} from './vaultStepUpSession'

const USER = 'user-1'
const FUTURE = new Date(Date.now() + 5 * 60_000).toISOString()

beforeEach(() => {
  sessionStorage.clear()
})

describe('saveVaultStepUpToken / readVaultStepUpToken', () => {
  it('stores a token per purpose — reveal and mutate never collide', () => {
    saveVaultStepUpToken(USER, 'reveal-token', FUTURE, 'vault_reveal')
    saveVaultStepUpToken(USER, 'mutate-token', FUTURE, 'vault_mutate')

    expect(readVaultStepUpToken(USER, 'vault_reveal')).toBe('reveal-token')
    expect(readVaultStepUpToken(USER, 'vault_mutate')).toBe('mutate-token')
    expect(readVaultStepUpToken(USER, 'vault_import')).toBeNull()
  })

  it('ignores an already-expired token', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    saveVaultStepUpToken(USER, 'stale-token', past, 'vault_reveal')
    expect(readVaultStepUpToken(USER, 'vault_reveal')).toBeNull()
  })
})

describe('clearVaultStepUpToken (F-02 — logout deve limpar o step-up do cofre)', () => {
  it('sem purpose, limpa os 3 propósitos do utilizador de uma vez (o que o logout chama)', () => {
    saveVaultStepUpToken(USER, 'reveal-token', FUTURE, 'vault_reveal')
    saveVaultStepUpToken(USER, 'mutate-token', FUTURE, 'vault_mutate')
    saveVaultStepUpToken(USER, 'import-token', FUTURE, 'vault_import')

    clearVaultStepUpToken(USER)

    expect(readVaultStepUpToken(USER, 'vault_reveal')).toBeNull()
    expect(readVaultStepUpToken(USER, 'vault_mutate')).toBeNull()
    expect(readVaultStepUpToken(USER, 'vault_import')).toBeNull()
  })

  it('não mexe no token de outro utilizador que continue com sessão activa', () => {
    saveVaultStepUpToken(USER, 'reveal-token', FUTURE, 'vault_reveal')
    saveVaultStepUpToken('user-2', 'other-token', FUTURE, 'vault_reveal')

    clearVaultStepUpToken(USER)

    expect(readVaultStepUpToken(USER, 'vault_reveal')).toBeNull()
    expect(readVaultStepUpToken('user-2', 'vault_reveal')).toBe('other-token')
  })

  it('userId undefined (ex.: logout de conta CLIENT, sem cofre) não rebenta', () => {
    expect(() => clearVaultStepUpToken(undefined)).not.toThrow()
  })
})

describe('persistVaultStepUpFromResponse', () => {
  it('guarda o token quando rememberSession=true e a resposta trouxe stepUpToken', () => {
    persistVaultStepUpFromResponse(USER, { stepUpToken: 'tok', stepUpExpiresAt: FUTURE }, true, 'vault_reveal')
    expect(readVaultStepUpToken(USER, 'vault_reveal')).toBe('tok')
  })

  it('limpa o token guardado quando rememberSession=false', () => {
    saveVaultStepUpToken(USER, 'reveal-token', FUTURE, 'vault_reveal')
    persistVaultStepUpFromResponse(USER, undefined, false, 'vault_reveal')
    expect(readVaultStepUpToken(USER, 'vault_reveal')).toBeNull()
  })
})
