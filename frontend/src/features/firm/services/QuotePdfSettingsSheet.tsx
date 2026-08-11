import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { Textarea } from '@/shared/components/ui/textarea'
import { api } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'

type QuotePdfSettings = {
  introText?: string
  termsText?: string
  footerText?: string
}

export function QuotePdfSettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['quote-pdf-settings'],
    queryFn: () => api.get('/contabil/quote-pdf-settings').then((r) => r.data.settings as QuotePdfSettings),
    enabled: open,
  })

  const [introText, setIntroText] = useState('')
  const [termsText, setTermsText] = useState('')
  const [footerText, setFooterText] = useState('')

  useEffect(() => {
    if (!data) return
    setIntroText(data.introText || '')
    setTermsText(data.termsText || '')
    setFooterText(data.footerText || '')
  }, [data])

  const saveMut = useMutation({
    mutationFn: (patch: QuotePdfSettings) =>
      api.patch('/contabil/quote-pdf-settings', patch).then((r) => r.data),
    onSuccess: () => {
      toast.success('Textos do PDF guardados')
      void qc.invalidateQueries({ queryKey: ['quote-pdf-settings'] })
      onOpenChange(false)
    },
    onError: (e) => toast.error('Erro ao guardar', { description: getErrorMessage(e) }),
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHiddenTitle>Personalizar PDF de orçamento</SheetHiddenTitle>
        <div className="space-y-5 py-2">
          <div>
            <h2 className="text-lg font-bold">Personalizar PDF de orçamento</h2>
            <p className="cb-text-caption">
              Estes textos aparecem em todos os orçamentos que gerar a partir de agora — não precisa de os
              reescrever a cada pedido. O nome do cliente, o serviço e o valor continuam sempre automáticos.
            </p>
          </div>
          <label className="block space-y-1">
            <span className="text-caption font-medium text-muted-foreground">
              Texto de abertura (ex.: saudação, apresentação do escritório)
            </span>
            <Textarea
              rows={3}
              className="resize-none rounded-lg text-sm"
              placeholder="Obrigado pelo seu contacto. Segue o orçamento solicitado."
              value={introText}
              onChange={(e: FormChangeEvent) => setIntroText(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-caption font-medium text-muted-foreground">
              Condições e prazos (ex.: validade do orçamento, forma de pagamento)
            </span>
            <Textarea
              rows={3}
              className="resize-none rounded-lg text-sm"
              placeholder="Orçamento válido por 30 dias. Pagamento por transferência bancária."
              value={termsText}
              onChange={(e: FormChangeEvent) => setTermsText(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-caption font-medium text-muted-foreground">
              Rodapé (ex.: dados bancários, contactos do escritório)
            </span>
            <Textarea
              rows={3}
              className="resize-none rounded-lg text-sm"
              placeholder="IBAN PT50 0000 0000 0000 0000 0000 0 · geral@escritorio.pt"
              value={footerText}
              onChange={(e: FormChangeEvent) => setFooterText(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({ introText, termsText, footerText })}
            >
              {saveMut.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
