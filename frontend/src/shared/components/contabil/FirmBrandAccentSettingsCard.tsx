import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Palette } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import type { FirmSettingsBundle } from '@/shared/types/firmSettings'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { getErrorMessage } from '@/shared/utils/errors'
import { parsePublicSiteHex } from '@/features/firm/public-site/publicSitePageBackground'

const HEX_RE = /^#[0-9a-f]{6}$/i
const DEFAULT_ACCENT = '#1e4d8c'

function isValidHex(value: string) {
  return HEX_RE.test(value.trim())
}

export function FirmBrandAccentSettingsCard({
  bundle,
  readOnly = false,
  onUpdated,
}: {
  bundle: FirmSettingsBundle
  readOnly?: boolean
  onUpdated?: () => void
}) {
  const initial = bundle.branding?.primaryColor || ''
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(bundle.branding?.primaryColor || '')
  }, [bundle.branding?.primaryColor])

  const invalid = value.trim() !== '' && !isValidHex(value)
  const dirty = value !== initial

  const onSave = async () => {
    if (readOnly || invalid) return
    setSaving(true)
    try {
      await firmSettingsApi.patchBranding({
        primaryColor: parsePublicSiteHex(value),
      })
      emitAppDataChanged({ scope: 'branding' })
      toast.success('Cor guardada no portal do cliente.', {
        description: 'Para teglion.com/…, use Página pública → C · Marca e extras → cores, publique o site.',
      })
      onUpdated?.()
    } catch (err) {
      toast.error('Não foi possível guardar a cor', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Palette className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">Cor de destaque (portal)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Afecta o menu do escritório e o portal do cliente. O site público na internet usa as cores em{' '}
            <Link to="/app/firm/settings?tab=pagina-publica&focus=brand" className="font-medium text-brand hover:underline">
              Página pública → C · Marca e extras
            </Link>{' '}
            — aí pode tirar o verde dos textos do destaque e dos botões de uma vez.
          </p>
        </div>
      </div>

      <div className="mt-5 max-w-md space-y-2">
        <Label htmlFor="firm-brand-primary" className="text-xs font-medium">
          Cor primária
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="color"
            aria-label="Cor primária do portal"
            disabled={readOnly}
            value={isValidHex(value) ? value : DEFAULT_ACCENT}
            onChange={(e) => setValue(parsePublicSiteHex(e.target.value) || '')}
            className="h-10 w-10 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5 disabled:opacity-50"
          />
          <Input
            id="firm-brand-primary"
            disabled={readOnly}
            value={value}
            onChange={(e: FormChangeEvent) => setValue(e.target.value.trim())}
            placeholder="Ex.: #071b36"
            className={invalid ? 'h-10 max-w-[9rem] border-destructive font-mono text-sm' : 'h-10 max-w-[9rem] font-mono text-sm'}
          />
          {!readOnly && dirty ? (
            <Button type="button" size="sm" className="h-10" disabled={saving || invalid} onClick={() => void onSave()}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
