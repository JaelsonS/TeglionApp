import type { FormChangeEvent } from '@/shared/types/react-events'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import {
  DEFAULT_PRIVACY_TEMPLATE,
  DEFAULT_TERMS_TEMPLATE,
} from '@/features/firm/public-site/publicSiteLegalTemplates'
import {
  DEFAULT_COMPLAINTS_BOOK_LABEL,
  DEFAULT_COMPLAINTS_BOOK_URL,
} from '@/features/firm/public-site/publicSiteLegalDefaults'

type Props = {
  id?: string
  draft: PublicSiteConfig
  onDraftChange: (next: PublicSiteConfig) => void
}

export function PublicSiteLegalFieldsEditor({ id, draft, onDraftChange }: Props) {
  return (
    <div id={id} className="space-y-3 rounded-lg border border-border/40 bg-muted/10 p-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Links legais no rodapé</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Termos, Privacidade, Livro de Reclamações e elogios — aparecem no rodapé da página pública.
          Responsabilidade do escritório; a Teglion (AfDigital) não presta aconselhamento jurídico.
        </p>
      </div>
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
      <div className="grid gap-4 lg:grid-cols-2">
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
    </div>
  )
}
