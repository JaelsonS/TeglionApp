import { describe, expect, it } from 'vitest'

import { servicePositionedImageStyle } from './servicePositionedImageStyle'

describe('servicePositionedImageStyle', () => {
  it('sem dado de posição, cai para object-cover centrado (compatibilidade com serviços antigos)', () => {
    const style = servicePositionedImageStyle({})
    expect(style.objectFit).toBe('cover')
    expect(style.objectPosition).toBe('50% 50%')
    expect(style.transform).toBeUndefined()
  })

  it('com ponto focal salvo, usa object-position correspondente', () => {
    const style = servicePositionedImageStyle({ imageFocusX: 20, imageFocusY: 80, imageZoom: 1 })
    expect(style.objectPosition).toBe('20% 80%')
    expect(style.transform).toBeUndefined()
  })

  it('com zoom > 1, aplica transform ancorado no mesmo ponto focal (não desalinha)', () => {
    const style = servicePositionedImageStyle({ imageFocusX: 30, imageFocusY: 70, imageZoom: 1.5 })
    expect(style.transform).toBe('scale(1.5)')
    expect(style.transformOrigin).toBe('30% 70%')
  })

  it('zoom exatamente 1 não aplica transform (evita CSS redundante)', () => {
    const style = servicePositionedImageStyle({ imageFocusX: 10, imageFocusY: 10, imageZoom: 1 })
    expect(style.transform).toBeUndefined()
  })
})
