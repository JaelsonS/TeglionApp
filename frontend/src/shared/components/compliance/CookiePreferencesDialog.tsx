import { Link } from 'react-router-dom'

import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import type { CookiePrefs } from '@/shared/utils/cookieConsent'

type Props = {
  open: boolean
  prefs: CookiePrefs
  onPrefsChange: (next: CookiePrefs) => void
  onSave: () => void
  onAcceptAll: () => void
  onReject: () => void
  onClose: () => void
}

export function CookiePreferencesDialog({
  open,
  prefs,
  onPrefsChange,
  onSave,
  onAcceptAll,
  onReject,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(next: boolean) => !next && onClose()}>
      <DialogContent className="max-w-md gap-4 sm:rounded-2xl" data-testid="cookie-prefs-dialog">
        <div>
          <DialogTitle className="text-lg font-semibold tracking-tight">Preferências de cookies</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Escolha o que o Teglion pode guardar neste browser. Os cookies essenciais mantêm o site a
            funcionar e não podem ser desligados. Pode alterar ou revogar a qualquer momento pelo ícone
            no canto inferior esquerdo.
          </DialogDescription>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Essenciais</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Sessão, segurança e idioma. Sem estes o site não funciona correctamente.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sempre
              </span>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-card p-3">
            <Checkbox
              className="mt-0.5"
              checked={prefs.analytics}
              onCheckedChange={(v: boolean | 'indeterminate') =>
                onPrefsChange({ ...prefs, analytics: v === true })
              }
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">Medição</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                Google Analytics (anónimo) para perceber que páginas ajudam os escritórios. Sem
                identificação pessoal.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-card p-3">
            <Checkbox
              className="mt-0.5"
              checked={prefs.advertising}
              onCheckedChange={(v: boolean | 'indeterminate') =>
                onPrefsChange({ ...prefs, advertising: v === true })
              }
            />
            <span>
              <span className="block text-sm font-semibold text-foreground">Anúncios</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                Conteúdo publicitário (quando existir). Desligado por omissão até aceitar.
              </span>
            </span>
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          Detalhe na{' '}
          <Link to="/cookies" className="font-medium text-teal-700 underline hover:text-teal-600">
            Política de Cookies
          </Link>
          .
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" className="rounded-full" onClick={onReject}>
            Rejeitar opcionais
          </Button>
          <Button type="button" variant="outline" className="rounded-full" onClick={onSave}>
            Guardar escolha
          </Button>
          <Button type="button" className="rounded-full text-white" onClick={onAcceptAll}>
            Aceitar todos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
