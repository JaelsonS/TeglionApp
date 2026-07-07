/** Deve coincidir com backend/src/constants/legal-versions.js */
export const CONTABIL_LEGAL_VERSIONS = {
  terms: '2026.05.22',
  privacy: '2026.05.22',
  dpa: '2026.05.22',
  cookies: '2026.05.22',
  notice: '2026.05.22',
} as const

export type ContabilLegalDocKey = keyof typeof CONTABIL_LEGAL_VERSIONS
