/** Deve coincidir com backend/src/constants/legal-versions.js */
export const CONTABIL_LEGAL_VERSIONS = {
  terms: '2026.08.18',
  privacy: '2026.08.18',
  dpa: '2026.08.18',
  cookies: '2026.08.18',
  notice: '2026.08.18',
} as const

export type ContabilLegalDocKey = keyof typeof CONTABIL_LEGAL_VERSIONS
