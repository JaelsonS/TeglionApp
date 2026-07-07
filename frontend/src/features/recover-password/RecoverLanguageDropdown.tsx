import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/shared/components/ui/button'

import { LOCALES, type RecoverLocale } from './i18n'

const LABELS: Record<RecoverLocale, string> = {
  'pt-PT': '🇵🇹 PT',
  'pt-BR': '🇧🇷 BR',
  'es-ES': '🇪🇸 ES',
  en: '🇺🇸 EN',
}

export function RecoverLanguageDropdown({
  locale,
  onChange,
}: {
  locale: RecoverLocale
  onChange: (next: RecoverLocale) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          className="h-9 rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/80 dark:text-white dark:hover:bg-slate-900"
          aria-label="Selecionar idioma"
        >
          {LABELS[locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-24">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onClick={() => onChange(l)}>
            {LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
