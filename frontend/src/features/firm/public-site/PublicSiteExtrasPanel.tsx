import type { ReactNode } from 'react'
import { Calendar, Palette, Scale, Search, Share2, Tag } from 'lucide-react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import type { FirmBookingSettings } from '@/shared/types/contabil'
import {
  DEFAULT_PRIVACY_TEMPLATE,
  DEFAULT_TERMS_TEMPLATE,
} from '@/features/firm/public-site/publicSiteLegalTemplates'
import {
  DEFAULT_COMPLAINTS_BOOK_LABEL,
  DEFAULT_COMPLAINTS_BOOK_URL,
} from '@/features/firm/public-site/publicSiteLegalDefaults'
import { publicSiteLegalFieldsDomId } from '@/features/firm/public-site/publicSiteLegalCompliance'

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  id?: string
  icon: typeof Palette
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      className={`rounded-xl border border-border/50 bg-card/90 p-4 shadow-sm ${className ?? ''}`}
    >
      <div className="mb-3 flex items-start gap-2.5">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

type Props = {
  firmSlug: string
  previewFirmName: string
  draft: PublicSiteConfig
  onDraftChange: (next: PublicSiteConfig) => void
  booking: FirmBookingSettings | undefined
  weekdayLabels: string[]
  logoSection: ReactNode
  pageColorsSection: ReactNode
  themeEditorSection: ReactNode
}

export function PublicSiteExtrasPanel({
  firmSlug,
  previewFirmName,
  draft,
  onDraftChange,
  booking,
  weekdayLabels,
  logoSection,
  pageColorsSection,
  themeEditorSection,
}: Props) {
  const seoTitle = draft.seo?.title || ''
  const seoDesc = draft.seo?.description || ''

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Marca visual, cores da página, <span className="font-medium text-foreground">Google</span>, horários de
        marcação e textos legais — tudo o que envolve a identidade do site além das secções de conteúdo.
      </p>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="xl:col-span-2">{logoSection}</div>

        <SectionCard
          icon={Palette}
          title="Cores de fundo"
          description="Página inteira e cartões — reflectem-se na pré-visualização à direita."
        >
          {pageColorsSection}
        </SectionCard>

        <SectionCard
          icon={Search}
          title="SEO (Google e partilhas)"
          description={`Como aparece ao pesquisar ou partilhar teglion.com/${firmSlug || '…'}. Se vazio, usamos o nome do escritório e o destaque.`}
        >
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground">Título (meta title)</span>
              <Input
                className="h-10"
                placeholder={previewFirmName.slice(0, 70)}
                maxLength={70}
                value={seoTitle}
                onChange={(e: FormChangeEvent) =>
                  onDraftChange({
                    ...draft,
                    seo: { ...draft.seo, title: e.target.value.trim() || null },
                  })
                }
              />
              <span className="text-[10px] text-muted-foreground">{seoTitle.length}/70 caracteres</span>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground">Descrição (meta description)</span>
              <textarea
                className="min-h-[88px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Breve resumo do escritório para resultados de pesquisa."
                maxLength={200}
                value={seoDesc}
                onChange={(e: FormChangeEvent) =>
                  onDraftChange({
                    ...draft,
                    seo: { ...draft.seo, description: e.target.value.trim() || null },
                  })
                }
              />
              <span className="text-[10px] text-muted-foreground">{seoDesc.length}/200 caracteres</span>
            </label>
          </div>
        </SectionCard>

        <SectionCard
          icon={Calendar}
          title="Agendamento online"
          description="Horários usados nos serviços com marcação na página pública."
        >
          <p className="text-sm text-foreground">
            {booking
              ? `${booking.weekdays.map((d) => weekdayLabels[d]).join(', ')} · ${booking.dayStart}–${booking.dayEnd} · slots de ${booking.slotMinutes} min`
              : 'A carregar disponibilidade…'}
          </p>
          <a
            href="/app/firm/agenda?panel=settings"
            className="mt-3 inline-flex text-xs font-medium text-brand hover:underline"
          >
            Editar disponibilidade na agenda →
          </a>
        </SectionCard>

        <SectionCard
          icon={Share2}
          title="Redes sociais e links extra"
          description="Instagram, WhatsApp, etc. — aparecem no rodapé e secções que activar."
          className="xl:col-span-2"
        >
          {themeEditorSection}
        </SectionCard>

        <SectionCard icon={Tag} title="Preços na página pública" className="xl:col-span-2">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 rounded border-border"
              checked={draft.showPrices !== false}
              onChange={(e) => onDraftChange({ ...draft, showPrices: e.target.checked })}
            />
            <span>
              <span className="font-medium text-foreground">Mostrar preços dos serviços</span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                Desligado = cartões e páginas de serviço sem valor visível (marcação continua disponível).
              </span>
            </span>
          </label>
        </SectionCard>

        <SectionCard
          id={publicSiteLegalFieldsDomId()}
          icon={Scale}
          title="Termos, privacidade e reclamações"
          description="Responsabilidade legal do escritório. A Teglion (AfDigital) não presta aconselhamento jurídico."
          className="xl:col-span-2"
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                onDraftChange({
                  ...draft,
                  complaintsBookUrl: draft.complaintsBookUrl || DEFAULT_COMPLAINTS_BOOK_URL,
                  complaintsBookLabel: draft.complaintsBookLabel || DEFAULT_COMPLAINTS_BOOK_LABEL,
                  termsText: draft.termsText || DEFAULT_TERMS_TEMPLATE,
                  privacyText: draft.privacyText || DEFAULT_PRIVACY_TEMPLATE,
                })
              }
            >
              Preencher sugestões legais
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() =>
                onDraftChange({
                  ...draft,
                  termsText: DEFAULT_TERMS_TEMPLATE,
                  privacyText: DEFAULT_PRIVACY_TEMPLATE,
                })
              }
            >
              Só modelos de termos e privacidade
            </Button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="block space-y-1.5 text-sm lg:col-span-2">
              <span className="font-medium">Termos de Utilização</span>
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={draft.termsText || ''}
                onChange={(e: FormChangeEvent) => onDraftChange({ ...draft, termsText: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1.5 text-sm lg:col-span-2">
              <span className="font-medium">Política de Privacidade</span>
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={draft.privacyText || ''}
                onChange={(e: FormChangeEvent) => onDraftChange({ ...draft, privacyText: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Livro de Reclamações — link</span>
              <Input
                placeholder={DEFAULT_COMPLAINTS_BOOK_URL}
                value={draft.complaintsBookUrl || ''}
                onChange={(e: FormChangeEvent) =>
                  onDraftChange({ ...draft, complaintsBookUrl: e.target.value || null })
                }
              />
              <button
                type="button"
                className="text-caption font-medium text-brand hover:underline"
                onClick={() =>
                  onDraftChange({
                    ...draft,
                    complaintsBookUrl: DEFAULT_COMPLAINTS_BOOK_URL,
                    complaintsBookLabel: draft.complaintsBookLabel || DEFAULT_COMPLAINTS_BOOK_LABEL,
                  })
                }
              >
                Usar link oficial (livroreclamacoes.pt)
              </button>
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Texto do link — Livro de Reclamações</span>
              <Input
                placeholder="Livro de Reclamações"
                value={draft.complaintsBookLabel || ''}
                onChange={(e: FormChangeEvent) =>
                  onDraftChange({ ...draft, complaintsBookLabel: e.target.value || null })
                }
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Elogios / avaliações — link</span>
              <Input
                placeholder="https://g.page/r/... (Google Reviews)"
                value={draft.praiseUrl || ''}
                onChange={(e: FormChangeEvent) => onDraftChange({ ...draft, praiseUrl: e.target.value || null })}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Texto do link — elogios</span>
              <Input
                placeholder="Deixe a sua avaliação no Google"
                value={draft.praiseLabel || ''}
                onChange={(e: FormChangeEvent) => onDraftChange({ ...draft, praiseLabel: e.target.value || null })}
              />
            </label>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
