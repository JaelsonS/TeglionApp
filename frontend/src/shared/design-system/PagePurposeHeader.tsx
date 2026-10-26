/**
 * PagePurposeHeader — cabeçalho autoexplicativo (título + «para que serve» + acção).
 * Alias semântico de PageHeader para a repaginação UI; mesma API visual.
 */
import { PageHeader, type PageHeaderProps } from '@/shared/components/layout/PageHeader'

export type PagePurposeHeaderProps = PageHeaderProps & {
  /** Frase «Esta página serve para…» — preferir a `subtitle` quando ambos existem. */
  purpose?: string
}

export function PagePurposeHeader({ purpose, subtitle, description, ...rest }: PagePurposeHeaderProps) {
  return (
    <PageHeader
      {...rest}
      subtitle={purpose ?? subtitle ?? description}
      description={undefined}
    />
  )
}
