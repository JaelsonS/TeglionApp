import { sanitizeServiceHtml } from '@/shared/utils/sanitizeServiceHtml'
import { cn } from '@/shared/lib/utils'

type Props = {
  html: string | null | undefined
  className?: string
}

/** Renderiza descrição de serviço como HTML sanitizado (DOMPurify). */
export function SanitizedServiceHtml({ html, className }: Props) {
  const clean = sanitizeServiceHtml(html)
  if (!clean) return null
  return (
    <div
      className={cn('prose prose-sm max-w-none text-muted-foreground', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
