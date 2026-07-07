import type { ContabilLegalDocKey } from '@/features/legal/contabil/versions'

export type LegalSection = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export type LegalDocument = {
  key: ContabilLegalDocKey
  title: string
  subtitle?: string
  updatedAtLabel: string
  updatedAtValue: string
  version: string
  intro: string[]
  sections: LegalSection[]
}
