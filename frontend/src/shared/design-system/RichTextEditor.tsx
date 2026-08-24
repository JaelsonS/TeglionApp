import { useEffect, useRef } from 'react'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { sanitizeServiceHtml } from '@/shared/utils/sanitizeServiceHtml'

type Props = {
  value: string
  onChange: (html: string) => void
  className?: string
  placeholder?: string
  /** Só leitura visual (ainda usa o mesmo editor, sem toolbar). */
  readOnly?: boolean
}

function runCommand(command: string) {
  document.execCommand(command, false)
}

/**
 * Editor minimalista (contentEditable) — negrito, itálico e listas.
 * Sem TipTap/Slate/Quill; o HTML é sanitizado em onChange.
 */
export function RichTextEditor({ value, onChange, className, placeholder, readOnly }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const lastEmitted = useRef(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (value !== lastEmitted.current && el.innerHTML !== value) {
      el.innerHTML = sanitizeServiceHtml(value || '')
    }
  }, [value])

  function emit() {
    const el = ref.current
    if (!el) return
    const html = sanitizeServiceHtml(el.innerHTML)
    lastEmitted.current = html
    onChange(html)
  }

  return (
    <div className={cn('rounded-lg border border-border/60 bg-background', className)}>
      {!readOnly ? (
        <div className="flex flex-wrap gap-0.5 border-b border-border/50 px-1 py-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Negrito"
            onMouseDown={(e) => {
              e.preventDefault()
              runCommand('bold')
              emit()
            }}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Itálico"
            onMouseDown={(e) => {
              e.preventDefault()
              runCommand('italic')
              emit()
            }}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Lista"
            onMouseDown={(e) => {
              e.preventDefault()
              runCommand('insertUnorderedList')
              emit()
            }}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Lista numerada"
            onMouseDown={(e) => {
              e.preventDefault()
              runCommand('insertOrderedList')
              emit()
            }}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-readonly={readOnly || undefined}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        data-placeholder={placeholder || ''}
        className={cn(
          'min-h-[4.5rem] px-3 py-2 text-sm outline-none',
          'prose prose-sm max-w-none [&:empty]:before:pointer-events-none [&:empty]:before:text-muted-foreground [&:empty]:before:content-[attr(data-placeholder)]',
          readOnly && 'cursor-default text-muted-foreground',
        )}
        onInput={() => emit()}
        onBlur={() => emit()}
      />
    </div>
  )
}
