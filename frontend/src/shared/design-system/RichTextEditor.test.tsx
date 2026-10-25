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
// O componente só (re)escreve innerHTML quando `value` vem de fora (não é o eco do
// seu próprio onChange) — guarda para não atropelar o cursor durante digitação.
// Há dois cenários reais de montagem e ambos têm de funcionar:
//  1. montar vazio e receber `value` depois (ServiceEditorSheet antigo: `description`
//     chegava num efeito após a montagem) → testes com `rerender`;
//  2. montar JÁ com `value` (ServiceFullEditorSheet: a secção «Descrição» só monta o
//     editor depois de `description` estar carregada; AgendaServicesCatalogPanel e
//     ServiceFormPreview montam inline com o valor) → testes de regressão abaixo.

describe('RichTextEditor', () => {
  it('REGRESSÃO: montado já com valor, mostra o HTML guardado (descrição não "desaparece")', () => {
    const saved = '<p>Declaração de <strong>IRS</strong> para trabalhadores independentes.</p>'
    const { container } = render(<RichTextEditor value={saved} onChange={vi.fn()} />)

    const editable = container.querySelector('[contenteditable]') as HTMLElement
    expect(editable.innerHTML).toContain('Declaração de')
    expect(editable.innerHTML).toContain('<strong>IRS</strong>')
  })

  it('REGRESSÃO: blur sem edição não emite string vazia (não apaga a descrição ao guardar)', () => {
    const onChange = vi.fn()
    const saved = '<p>Texto guardado pela contabilista.</p>'
    const { container } = render(<RichTextEditor value={saved} onChange={onChange} />)
    const editable = container.querySelector('[contenteditable]') as HTMLElement

    editable.dispatchEvent(new FocusEvent('blur', { bubbles: true }))

    for (const [emitted] of onChange.mock.calls) {
      expect(emitted).toContain('Texto guardado pela contabilista.')
    }
  })

  it('montado já com valor em modo readOnly, mostra o conteúdo (pré-visualização)', () => {
    const { container } = render(
      <RichTextEditor value="<p>Pré-visualização pública</p>" onChange={() => undefined} readOnly />,
    )
    const editable = container.querySelector('[contenteditable]') as HTMLElement
    expect(editable.innerHTML).toContain('Pré-visualização pública')
  })

  it('não reescreve o DOM quando `value` é o eco do próprio onChange (preserva o cursor)', () => {
    let current = ''
    const onChange = vi.fn((html: string) => {
      current = html
    })
    const { container, rerender } = render(<RichTextEditor value={current} onChange={onChange} />)
    const editable = container.querySelector('[contenteditable]') as HTMLElement

    editable.innerHTML = '<p>a escrever</p>'
    editable.dispatchEvent(new Event('input', { bubbles: true }))
    expect(onChange).toHaveBeenCalled()

    // Marca o DOM para detectar uma reescrita indevida no re-render com o eco.
    const nodeBefore = editable.firstChild
    rerender(<RichTextEditor value={current} onChange={onChange} />)
    expect(editable.firstChild).toBe(nodeBefore)
  })

  it('actualiza o DOM quando o valor muda de fora (ex.: abrir outro serviço no mesmo editor)', () => {
    const { container, rerender } = render(<RichTextEditor value="<p>Serviço A</p>" onChange={vi.fn()} />)
    const editable = container.querySelector('[contenteditable]') as HTMLElement
    expect(editable.innerHTML).toContain('Serviço A')

    rerender(<RichTextEditor value="<p>Serviço B</p>" onChange={vi.fn()} />)
    expect(editable.innerHTML).toContain('Serviço B')
    expect(editable.innerHTML).not.toContain('Serviço A')
  })

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
