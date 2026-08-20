/** @vitest-environment jsdom */
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RichTextEditor } from './RichTextEditor'

// IMPORTANTE: este arquivo usa jsdom, não happy-dom (o padrão do resto do projeto).
// DOMPurify (usado por sanitizeServiceHtml) depende de APIs de DOM que o happy-dom
// não implementa por completo — sob happy-dom, DOMPurify.sanitize() pode devolver
// tags perigosas (ex.: <script>) intactas, dando um falso positivo de segurança
// num teste que passaria mesmo com a sanitização quebrada. Confirmado empiricamente
// durante a auditoria de segurança de 19-20/08/2026: o mesmo input sanitizado sob
// happy-dom preserva "<script>alert(1)</script>"; sob jsdom (ambiente que o
// DOMPurify oficialmente suporta) o resultado é "" (tudo removido), como esperado.
// Qualquer teste futuro que precise validar sanitização de HTML deve usar jsdom.
//
// O componente só (re)escreve innerHTML quando `value` MUDA em relação ao último
// valor emitido (guarda para não atropelar o cursor durante digitação) — ver
// `ServiceEditorSheet.tsx`, onde `description` é recarregada num efeito depois da
// montagem. Por isso os testes montam com um valor inicial e usam `rerender` para
// simular esse carregamento assíncrono real, em vez de montar já com o valor final.

describe('RichTextEditor', () => {
  it('sanitiza HTML perigoso quando o valor carregado muda após a montagem (regressão XSS)', () => {
    const malicious = '<img src=x onerror="alert(document.cookie)"><script>alert(1)</script>'
    const { container, rerender } = render(<RichTextEditor value="" onChange={vi.fn()} />)
    rerender(<RichTextEditor value={malicious} onChange={vi.fn()} />)

    const editable = container.querySelector('[contenteditable]')
    expect(editable).not.toBeNull()
    expect(editable!.innerHTML).not.toContain('onerror')
    expect(editable!.innerHTML).not.toContain('<script')
    expect(editable!.innerHTML).not.toContain('<img')
  })

  it('preserva tags da allowlist (negrito, itálico, listas) ao carregar', () => {
    const safe = '<p><strong>importante</strong> e <em>urgente</em></p>'
    const { container, rerender } = render(<RichTextEditor value="" onChange={vi.fn()} />)
    rerender(<RichTextEditor value={safe} onChange={vi.fn()} />)

    const editable = container.querySelector('[contenteditable]')
    expect(editable!.innerHTML).toContain('<strong>')
    expect(editable!.innerHTML).toContain('<em>')
  })

  it('sanitiza HTML perigoso ao emitir onChange (input do usuário)', () => {
    const onChange = vi.fn()
    const { container } = render(<RichTextEditor value="" onChange={onChange} />)
    const editable = container.querySelector('[contenteditable]') as HTMLElement

    editable.innerHTML = '<img src=x onerror="alert(1)">texto'
    editable.dispatchEvent(new Event('input', { bubbles: true }))

    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(emitted).not.toContain('onerror')
  })
})
