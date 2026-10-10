import type { ChangeEvent } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import { applyPageBackgroundColor, parsePublicSiteHex } from './publicSitePageBackground'
import {
  applyHeroHighlightTextColors,
  resolveHeroHighlightTextColor,
  setThemePrimaryColor,
} from './publicSiteBrandColors'
import { toast } from 'sonner'

const HEX_RE = /^#[0-9a-f]{6}$/i
const DEFAULT_ACCENT = '#1e4d8c'
const DEFAULT_PAGE_BG = '#faf9f7'
const DEFAULT_SURFACE = '#ffffff'
const DEFAULT_HERO_TEXT = '#071b36'

function isValidHex(value: string) {
  return HEX_RE.test(value.trim())
}

type Props = {
  draft: PublicSiteConfig
  onChange: (next: PublicSiteConfig) => void
  /** heroQuick = só destaque + textos do hero; full = inclui fundos (secção C). */
  variant?: 'full' | 'heroQuick'
}

function ColorRow({
  id,
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  value: string
  fallback: string
  onChange: (hex: string | null) => void
}) {
  const invalid = value.trim() !== '' && !isValidHex(value)
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-[11px] font-semibold text-foreground">
        {label}
      </Label>
      {hint ? <p className="text-[10px] leading-snug text-muted-foreground">{hint}</p> : null}
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={isValidHex(value) ? value : fallback}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(parsePublicSiteHex(e.target.value))}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border/60 bg-transparent p-0.5"
        />
        <Input
          id={id}
          value={value}
          onChange={(e: FormChangeEvent) => onChange(parsePublicSiteHex(e.target.value.trim() || null))}
          placeholder="Padrão"
          className={invalid ? 'h-9 border-destructive font-mono text-xs' : 'h-9 font-mono text-xs'}
        />
        {value.trim() ? (
          <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 px-2 text-xs" onClick={() => onChange(null)}>
            Limpar
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function PublicSiteBrandColorsPanel({ draft, onChange, variant = 'full' }: Props) {
  const primary = draft.theme.primaryColor || ''
  const heroText = resolveHeroHighlightTextColor(draft) || ''
  const bg = draft.theme.backgroundColor || ''
  const surface = draft.theme.surfaceColor || ''
  const showBackgrounds = variant === 'full'

  const setPrimary = (value: string | null) => {
    onChange(setThemePrimaryColor(draft, value))
  }

  const setHeroText = (value: string | null) => {
    onChange(applyHeroHighlightTextColors(draft, value))
  }

  const setPageBackground = (value: string | null) => {
    const prev = parsePublicSiteHex(draft.theme.backgroundColor)
    const nextParsed = parsePublicSiteHex(value)
    const hadSectionBgs = draft.sections.some((s) => {
      const c = s.content as { backgroundColor?: string | null }
      return Boolean(c?.backgroundColor)
    })
    const next = applyPageBackgroundColor(draft, value)
    onChange(next)
    if (hadSectionBgs && nextParsed && nextParsed !== prev) {
      toast.message('Fundos das secções limpos', {
        description: 'Assim a cor da página aparece no preview. Pode voltar a colorir cada bloco nas secções.',
      })
    }
  }

  const copyAccentToHeroTexts = () => {
    const accent = parsePublicSiteHex(draft.theme.primaryColor)
    if (!accent) {
      toast.message('Defina primeiro a cor de destaque do site.')
      return
    }
    onChange(applyHeroHighlightTextColors(draft, accent))
    toast.success('Textos do destaque actualizados — guarde o rascunho e publique.')
  }

  const wrapperClass =
    variant === 'heroQuick'
      ? 'space-y-3 rounded-lg border border-brand/35 bg-brand/[0.05] p-3'
      : 'space-y-4'

  return (
    <div className={wrapperClass}>
      {variant === 'heroQuick' ? (
        <div>
          <p className="text-sm font-semibold text-foreground">Cores do destaque (rápido)</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Se vê <span className="font-medium text-foreground">verde ou outra cor</span> no título ou na frase, ajuste
            aqui. «Limpar» nos textos faz-nos usar a cor de destaque do site (primeiro campo).
          </p>
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Depois de alterar: <span className="font-medium text-foreground">Guardar rascunho</span> e{' '}
          <span className="font-medium text-foreground">Publicar</span> — só então o visitante vê as novas cores.
        </p>
      )}

      <ColorRow
        id="ps-accent-primary"
        label="Cor de destaque do site"
        hint="Botões, preços, ícones e textos que não têm cor própria (inclui destaque quando o texto está em «Padrão»)."
        value={primary}
        fallback={DEFAULT_ACCENT}
        onChange={setPrimary}
      />

      <ColorRow
        id="ps-hero-text"
        label="Cor dos textos no destaque principal"
        hint="Título, frase curta e parágrafo do bloco «Destaque principal». Recomendado: azul escuro ou preto — não deixe em branco se não quiser a cor de destaque."
        value={heroText}
        fallback={DEFAULT_HERO_TEXT}
        onChange={setHeroText}
      />

      {primary && !heroText ? (
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={copyAccentToHeroTexts}>
          Usar cor de destaque também nos textos do destaque
        </Button>
      ) : null}

      {showBackgrounds ? (
        <div className="grid gap-3 border-t border-border/40 pt-4 sm:grid-cols-2">
          <ColorRow
            id="ps-page-bg"
            label="Fundo da página"
            value={bg}
            fallback={DEFAULT_PAGE_BG}
            onChange={setPageBackground}
          />
          <ColorRow
            id="ps-surface"
            label="Fundo dos cartões"
            value={surface}
            fallback={DEFAULT_SURFACE}
            onChange={(value) =>
              onChange({
                ...draft,
                theme: { ...draft.theme, surfaceColor: parsePublicSiteHex(value) },
              })
            }
          />
        </div>
      ) : null}

      {showBackgrounds ? (
        <p className="text-[10px] leading-snug text-muted-foreground">
          Mudar o fundo da página limpa cores de fundo dos blocos para o preview actualizar.
        </p>
      ) : null}
    </div>
  )
}
