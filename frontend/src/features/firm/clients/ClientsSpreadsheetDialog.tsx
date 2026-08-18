import { useState, type ChangeEvent } from 'react'
import { Download, FileSpreadsheet, Shield, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { contabilClientsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { PasswordInput } from '@/shared/components/ui/password-input'
import { FormField } from '@/shared/design-system'
import { getErrorMessage } from '@/shared/utils/errors'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.click()
  URL.revokeObjectURL(url)
}

export function ClientsSpreadsheetDialog({ open, onOpenChange, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [busy, setBusy] = useState<'export' | 'template' | 'import' | null>(null)

  const reset = () => {
    setFile(null)
    setCurrentPassword('')
    setBusy(null)
  }

  const download = async (template: boolean) => {
    setBusy(template ? 'template' : 'export')
    try {
      const blob = await contabilClientsApi.exportClientsCsv(template)
      triggerDownload(blob, template ? 'teglion-modelo-clientes.csv' : 'teglion-clientes.csv')
      toast.success(template ? 'Modelo CSV descarregado' : 'Ficha dos clientes descarregada')
    } catch (err) {
      toast.error('Não foi possível descarregar o CSV', { description: getErrorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  const importFile = async () => {
    if (!file) {
      toast.error('Escolha um ficheiro .csv')
      return
    }
    setBusy('import')
    try {
      const report = await contabilClientsApi.importClientsCsv(file, currentPassword || undefined)
      const extra = report.errors.slice(0, 4).map((e) => `Linha ${e.line}: ${e.message}`)
      toast.success(
        `Importação concluída · ${report.created} criados · ${report.updated} actualizados · ${report.skipped} ignorados`,
        extra.length ? { description: extra.join(' · ') } : undefined,
      )
      reset()
      onOpenChange(false)
      onImported?.()
    } catch (err) {
      toast.error('Não foi possível importar o CSV', { description: getErrorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-lg" data-testid="clients-spreadsheet-dialog">
        <DialogHeader>
          <DialogTitle>Ficha em CSV</DialogTitle>
          <DialogDescription>
            Modelo de texto para Excel (Portugal). Sem macros, sem .xlsx. Células vazias não
            alteram dados já gravados. As senhas dos portais nunca saem na exportação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => void download(false)}
            >
              <Download className="h-4 w-4" />
              {busy === 'export' ? 'A preparar…' : 'Exportar carteira'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(busy)}
              onClick={() => void download(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {busy === 'template' ? 'A preparar…' : 'Modelo vazio'}
            </Button>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Abra o CSV no Excel, preencha o que souber e volte a importar. O NIF identifica o
              cliente. Senhas oficiais (AT, SS, ViaCTT, IAPMEI, Relatório Único) só entram se a
              coluna estiver preenchida.
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-xs"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)}
            />
            <FormField
              label="Palavra-passe do Teglion (só se o CSV tiver senhas de portais)"
              htmlFor="clients-csv-step-up"
            >
              <PasswordInput
                id="clients-csv-step-up"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Opcional se as colunas de senha estiverem vazias"
              />
            </FormField>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Ficheiros .xlsx, .xls e macros são recusados. Não pedimos a senha dos portais do
              Estado — só a da sua conta Teglion, quando o CSV traz senhas novas.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={Boolean(busy)}>
            Fechar
          </Button>
          <Button type="button" variant="primary" onClick={() => void importFile()} disabled={Boolean(busy) || !file}>
            <Upload className="h-4 w-4" />
            {busy === 'import' ? 'A importar…' : 'Importar CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
