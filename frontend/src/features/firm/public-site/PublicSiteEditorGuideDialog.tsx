import { CircleHelp } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'

const STEPS = [
  {
    id: 'A',
    title: 'Link e publicar',
    body: 'Endereço teglion.com/…, nome na barra, Guardar rascunho, Pré-visualizar e Publicar. Só o visitante vê a versão publicada.',
  },
  {
    id: 'B',
    title: 'Secções da página',
    body: 'Abra uma secção de cada vez (Destaque, Serviços, Contactos…). Textos e imagens de fundo ficam dentro de cada bloco.',
  },
  {
    id: 'C',
    title: 'Marca e extras',
    body: 'Cores de destaque, logótipos só do site, fundos e SEO. Imagens dos cartões de serviço abrem num modal dentro de Serviços.',
  },
] as const

export function PublicSiteEditorGuideDialog({ triggerClassName }: { triggerClassName?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={triggerClassName ?? 'h-8 gap-1.5 text-xs'}>
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
          Guia do editor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Como editar a página pública</DialogTitle>
          <DialogDescription>
            Três zonas — siga A → B → C. A pré-visualização à direita actualiza ao guardar o rascunho (excepto imagens de
            serviços, que guardam na hora).
          </DialogDescription>
        </DialogHeader>
        <ol className="mt-2 space-y-3">
          {STEPS.map((step) => (
            <li key={step.id} className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-sm font-semibold text-foreground">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand/15 text-xs font-bold text-brand">
                  {step.id}
                </span>
                {step.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  )
}
