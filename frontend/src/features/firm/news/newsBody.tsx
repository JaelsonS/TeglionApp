import type { ReactNode } from 'react'
import { parseNewsBody } from '@/features/firm/news/parseNewsBody'

type NewsBodyProps = {
  body: string | null | undefined
  className?: string
  /** Mapa opcional storageKey → URL assinada (ex. preview no composer). */
  srcMap?: Record<string, string>
}

/** Renderiza o corpo da notícia com imagens só via marcador ![](url). */
export function NewsBodyContent({ body, className, srcMap }: NewsBodyProps) {
  const parts = parseNewsBody(body)
  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part.type === 'image') {
      const src = srcMap?.[part.src] || part.src
      if (src.startsWith('firm/')) {
        return (
          <span key={`img-${i}`} className="my-2 block text-xs text-muted-foreground">
            [imagem]
          </span>
        )
      }
      return (
        <img
          key={`img-${i}`}
          src={src}
          alt=""
          className="my-4 max-h-96 w-full rounded-xl object-contain"
        />
      )
    }
    return (
      <span key={`txt-${i}`} className="whitespace-pre-wrap">
        {part.value}
      </span>
    )
  })
  return <div className={className}>{nodes}</div>
}

export { parseNewsBody }
