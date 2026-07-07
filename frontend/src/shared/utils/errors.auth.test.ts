/** @vitest-environment happy-dom */
import { describe, expect, it } from 'vitest'
import axios from 'axios'

import { isRefreshTokenMissingError, isRecoverableBootstrapError } from '@/shared/utils/errors'

describe('isRefreshTokenMissingError', () => {
  it('detects REFRESH_TOKEN_MISSING code', () => {
    const err = new axios.AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 401,
        data: { code: 'REFRESH_TOKEN_MISSING', message: 'Sessão não encontrada.' },
      } as any,
    )
    expect(isRefreshTokenMissingError(err)).toBe(true)
    expect(isRecoverableBootstrapError(err)).toBe(true)
  })

  it('returns false for invalid session', () => {
    const err = new axios.AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 401,
        data: { code: 'INVALID_REFRESH' },
      } as any,
    )
    expect(isRefreshTokenMissingError(err)).toBe(false)
  })
})
