import { ImageIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import type { AccountingService } from '@/shared/types/contabil'
import { ServiceCatalogImageField } from '@/features/firm/services/ServiceCatalogImageField'

type Props = {
  firmSlug?: string
  bookingFilter?: boolean
  /** Texto curto na secção (ex.: «com marcação online»). */
  sectionHint?: string
  triggerLabel?: string
  className?: string
}

function filterSectionServices(items: AccountingService[], bookingFilter?: boolean) {
  return items
    .filter((s) => s.isPubliclyListed && s.isActive !== false)
    .filter((s) => (bookingFilter == null ? true : Boolean(s.requiresBooking) === bookingFilter))
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export function PublicSiteServiceImagesDialog({
  firmSlug,
  bookingFilter,
  sectionHint,
  triggerLabel = 'Imagens dos cartões na página',
  className,
}: Props) {
  const catalogQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'public-site-order'],
    queryFn: () => contabilAccountingServicesApi.list({ activeOnly: true }),
    staleTime: 15_000,
  })

  const items: AccountingService[] = Array.isArray(catalogQuery.data?.items)
    ? catalogQuery.data.items
    : Array.isArray(catalogQuery.data)
      ? catalogQuery.data
      : []

  const sectionServices = filterSectionServices(items, bookingFilter)
  const count = sectionServices.length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className ?? 'h-8 gap-1.5 text-xs'}>
          <ImageIcon className="h-3.5 w-3.5" aria-hidden />
          {triggerLabel}
          {count > 0 ? ` (${count})` : ''}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(92vh,720px)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Imagens dos serviços na página pública</DialogTitle>
          <DialogDescription>
            Mesma imagem do menu Serviços — aparece nos cartões{sectionHint ? ` ${sectionHint}` : ''} e na página de
            cada oferta. Guarda de imediato; não precisa de «Guardar rascunho» só por causa da foto.
          </DialogDescription>
        </DialogHeader>
        {catalogQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">A carregar catálogo…</p>
        ) : count === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum serviço público nesta secção. Em Serviços, active «Aparece na página pública».
          </p>
        ) : (
          <ul className="space-y-3">
            {sectionServices.map((svc) => (
              <li key={svc.id}>
                <ServiceCatalogImageField service={svc} firmSlug={firmSlug} layout="block" />
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
