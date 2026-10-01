import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

type Props = {
  termsText?: string | null
  privacyText?: string | null
  textColor?: string
}

function hasText(value?: string | null): boolean {
  return Boolean(String(value || '').trim())
}

export function PublicSiteLegalFooterLinks({ termsText, privacyText, textColor }: Props) {
  const [open, setOpen] = useState<'terms' | 'privacy' | null>(null)
  const showTerms = hasText(termsText)
  const showPrivacy = hasText(privacyText)
  if (!showTerms && !showPrivacy) return null

  const linkClass = 'underline underline-offset-2 hover:opacity-80'
  const linkStyle = textColor ? { color: textColor } : undefined

  return (
    <>
      <p
        className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 ${textColor ? '' : 'text-muted-foreground'}`}
        style={textColor ? { color: textColor } : undefined}
      >
        {showTerms ? (
          <button type="button" className={linkClass} style={linkStyle} onClick={() => setOpen('terms')}>
            Termos de Utilização
          </button>
        ) : null}
        {showTerms && showPrivacy ? <span aria-hidden>·</span> : null}
        {showPrivacy ? (
          <button type="button" className={linkClass} style={linkStyle} onClick={() => setOpen('privacy')}>
            Política de Privacidade
          </button>
        ) : null}
      </p>
      <Dialog open={Boolean(open)} onOpenChange={(next: boolean) => !next && setOpen(null)}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{open === 'privacy' ? 'Política de Privacidade' : 'Termos de Utilização'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[min(60dvh,28rem)] overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
            {open === 'privacy' ? privacyText : termsText}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
