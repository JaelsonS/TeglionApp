import type { ContabilLegalDocKey } from '@/features/legal/contabil/versions'
import type { LegalDocument } from '@/features/legal/contabil/types'
import { cookiesDocument } from '@/features/legal/contabil/documents/cookies'
import { dpaDocument } from '@/features/legal/contabil/documents/dpa'
import { noticeDocument } from '@/features/legal/contabil/documents/notice'
import { privacyDocument } from '@/features/legal/contabil/documents/privacy'
import { termsDocument } from '@/features/legal/contabil/documents/terms'

const DOCUMENTS: Record<ContabilLegalDocKey, LegalDocument> = {
  terms: termsDocument,
  privacy: privacyDocument,
  dpa: dpaDocument,
  cookies: cookiesDocument,
  notice: noticeDocument,
}

export function getContabilLegalDocument(key: ContabilLegalDocKey): LegalDocument {
  return DOCUMENTS[key]
}

export const CONTABIL_LEGAL_DOCUMENTS = DOCUMENTS
