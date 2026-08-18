import { describe, expect, it } from 'vitest'

import { dpaDocument } from './dpa'
import { noticeDocument } from './notice'
import { privacyDocument } from './privacy'
import { termsDocument } from './terms'

function allText(doc: { intro: string[]; sections: Array<{ paragraphs: string[]; bullets?: string[] }> }) {
  return [
    ...doc.intro,
    ...doc.sections.flatMap((s) => [...s.paragraphs, ...(s.bullets || [])]),
  ].join('\n')
}

describe('legal identity', () => {
  it('never treats Teglion as the legal processor', () => {
    for (const doc of [privacyDocument, termsDocument, dpaDocument, noticeDocument]) {
      expect(allText(doc)).not.toMatch(/O Teglion actua como Subcontratante/)
      expect(allText(doc)).toMatch(/AfDigital/)
    }
  })

  it('says Teglion is not a legal person in the imprint', () => {
    expect(allText(noticeDocument)).toMatch(/não é uma empresa/)
  })
})
