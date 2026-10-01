import type { ReactNode } from 'react'
import { ExternalLink, Eye, Globe, Link2, Save, Trash2, Upload } from 'lucide-react'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'

type Props = {
  publishedAt: string | null | undefined
  firmSlug: string
  slugDraft: string
  onSlugDraftChange: (value: string) => void
  savingSlug: boolean
  onSaveSlug: () => void
  canEditLink: boolean
  publicDisplayName: string
  onPublicDisplayNameChange: (value: string) => void
  savingDisplayName: boolean
  onSaveDisplayName: () => void
  firmNameFallback: string
  saving: boolean
  previewing: boolean
  publishing: boolean
  resetting: boolean
  onSaveDraft: () => void
  onPreview: () => void
  onOpenPublishConfirm: () => void
  onOpenResetConfirm: () => void
}

function FieldHelp({ children }: { children: ReactNode }) {
  return <p className="text-[11px] leading-relaxed text-muted-foreground">{children}</p>
}

export function PublicSiteLinkPublishPanel({
  publishedAt,
  firmSlug,
  slugDraft,
  onSlugDraftChange,
  savingSlug,
  onSaveSlug,
  canEditLink,
  publicDisplayName,
  onPublicDisplayNameChange,
  savingDisplayName,
  onSaveDisplayName,
  firmNameFallback,
  saving,
  previewing,
  publishing,
  resetting,
  onSaveDraft,
  onPreview,
  onOpenPublishConfirm,
  onOpenResetConfirm,
}: Props) {
  const isPublished = Boolean(publishedAt)
  const slugDirty = slugDraft.trim() !== firmSlug
  const publicUrl = firmSlug ? `https://teglion.com/${firmSlug}` : null

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Defina o <span className="font-medium text-foreground">endereço</span> que partilha com clientes, o{' '}
        <span className="font-medium text-foreground">nome na barra</span> do site e quando torna a versão visível
        para qualquer pessoa na internet.
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_min(17.5rem,34%)] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-card/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</p>
                <p className="mt-1.5 text-sm font-medium text-foreground">
                  {isPublished
                    ? `Última publicação: ${new Date(String(publishedAt)).toLocaleString('pt-PT')}`
                    : 'Ainda não publicou — visitantes só vêem a versão antiga ou página vazia.'}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  isPublished
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-500/15 text-amber-900 dark:text-amber-100',
                )}
              >
                {isPublished ? 'Online' : 'Rascunho'}
              </span>
            </div>
            {publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex max-w-full items-center gap-1.5 truncate text-xs font-medium text-brand hover:underline"
              >
                <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {publicUrl.replace('https://', '')}
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </a>
            ) : null}
          </div>

          {canEditLink ? (
            <>
              <div className="rounded-xl border border-border/50 bg-card/80 p-4 shadow-sm space-y-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Link2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Link público</p>
                    <FieldHelp>
                      Escolha um endereço curto e fácil de dizer por telefone. Use só letras minúsculas, números e
                      hífens. Guarde antes de partilhar cartões ou e-mails.
                    </FieldHelp>
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="sr-only">Slug do link público</span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex min-h-10 flex-1 items-center gap-1 rounded-lg border border-input bg-background px-3 py-2">
                      <span className="shrink-0 text-sm text-muted-foreground">teglion.com/</span>
                      <Input
                        className="h-8 border-0 bg-transparent p-0 font-mono text-sm shadow-none focus-visible:ring-0"
                        value={slugDraft}
                        onChange={(e: FormChangeEvent) =>
                          onSlugDraftChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                        }
                        placeholder="o-seu-escritorio"
                        maxLength={60}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10"
                        disabled={savingSlug || !slugDraft.trim() || !slugDirty}
                        onClick={onSaveSlug}
                      >
                        {savingSlug ? 'A guardar…' : 'Guardar link'}
                      </Button>
                      {firmSlug ? (
                        <Button type="button" variant="ghost" size="sm" className="h-10" asChild>
                          <a href={`/${encodeURIComponent(firmSlug)}`} target="_blank" rel="noopener noreferrer">
                            Abrir site <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </label>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/80 p-4 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-foreground">Nome na barra do topo</p>
                <FieldHelp>
                  É o texto ao lado do logótipo no site público — pode ser o nome comercial, não precisa de ser igual
                  ao nome legal do escritório no Teglion.
                </FieldHelp>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    className="h-10 flex-1 text-sm"
                    value={publicDisplayName}
                    onChange={(e: FormChangeEvent) => onPublicDisplayNameChange(e.target.value)}
                    placeholder={firmNameFallback || 'Como aparece na barra'}
                    maxLength={120}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 shrink-0 sm:min-w-[8.5rem]"
                    disabled={savingDisplayName}
                    onClick={onSaveDisplayName}
                  >
                    {savingDisplayName ? 'A guardar…' : 'Guardar nome'}
                  </Button>
                </div>
              </div>
            </>
          ) : firmSlug ? (
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
              Link actual:{' '}
              <a
                href={`/${encodeURIComponent(firmSlug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                teglion.com/{firmSlug}
              </a>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-brand/25 bg-gradient-to-b from-brand/[0.06] to-card p-4 shadow-sm lg:sticky lg:top-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Publicar alterações</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            O rascunho fica só para si até carregar em Publicar. Pré-visualizar abre o site como visitante, com link
            temporário.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-start gap-2"
              disabled={saving || publishing}
              onClick={onSaveDraft}
            >
              <Save className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="text-left">
                <span className="block text-sm font-medium">Guardar rascunho</span>
                <span className="block text-[10px] font-normal text-muted-foreground">Grava secções e cores sem publicar</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full justify-start gap-2"
              disabled={previewing || !firmSlug}
              onClick={onPreview}
            >
              <Eye className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              <span className="text-left">
                <span className="block text-sm font-medium">Pré-visualizar</span>
                <span className="block text-[10px] font-normal text-muted-foreground">Nova aba — só equipa com o link</span>
              </span>
            </Button>
            <Button
              type="button"
              variant="primary"
              className="h-12 w-full justify-start gap-2"
              disabled={publishing}
              loading={publishing}
              onClick={onOpenPublishConfirm}
            >
              <Upload className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-left">
                <span className="block text-sm font-semibold">Publicar site</span>
                <span className="block text-[10px] font-normal opacity-90">Torna visível em teglion.com/{firmSlug || '…'}</span>
              </span>
            </Button>
          </div>
          {canEditLink ? (
            <div className="mt-4 border-t border-border/50 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={resetting}
                onClick={onOpenResetConfirm}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                Apagar página e recomeçar
              </Button>
              <FieldHelp>
                Remove rascunho e versão publicada. Serviços e pagamentos não são afectados.
              </FieldHelp>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
