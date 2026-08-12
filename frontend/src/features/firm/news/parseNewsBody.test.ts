import { describe, expect, it } from 'vitest'
import { parseNewsBody } from '@/features/firm/news/parseNewsBody'

describe('parseNewsBody', () => {
  it('returns empty for blank', () => {
    expect(parseNewsBody('')).toEqual([])
    expect(parseNewsBody(null)).toEqual([])
  })

  it('keeps plain text', () => {
    expect(parseNewsBody('Olá mundo')).toEqual([{ type: 'text', value: 'Olá mundo' }])
  })

  it('parses exact image markers only', () => {
    const parts = parseNewsBody('Antes\n![](https://cdn.example/a.png)\nDepois ![](firm/x/news/body/1.jpg) fim')
    expect(parts).toEqual([
      { type: 'text', value: 'Antes\n' },
      { type: 'image', src: 'https://cdn.example/a.png' },
      { type: 'text', value: '\nDepois ' },
      { type: 'image', src: 'firm/x/news/body/1.jpg' },
      { type: 'text', value: ' fim' },
    ])
  })

  it('ignores HTML and non-exact markers', () => {
    const raw = 'texto <img src="x"> ![alt](https://x) ![](javascript:alert(1))'
    expect(parseNewsBody(raw)).toEqual([{ type: 'text', value: raw }])
  })
})
