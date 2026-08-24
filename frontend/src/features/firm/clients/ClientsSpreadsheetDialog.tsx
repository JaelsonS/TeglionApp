import { useState, type ChangeEvent } from 'react'
import { Download, FileSpreadsheet, Shield, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { contabilClientsApi } from '@/infrastructure/api'
import {
  persistVaultStepUpFromResponse,
  vaultUnlockPayload,
} from '@/features/firm/client-hub/vaultStepUpSession'
import { AskMayaButton, openMaya, setMayaFabVisible } from '@/features/maya'
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
import { useAuth } from '@/shared/hooks/useAuth'
import { getApiErrorCode, getErrorMessage } from '@/shared/utils/errors'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void
}

type CsvRejectKind = 'xlsx' | 'content' | 'header' | 'empty' | 'large' | 'generic'

const REJECT_COPY: Record<CsvRejectKind, { title: string; body: string }> = {
  xlsx: {
    title: 'Este ficheiro não é CSV — o Teglion recusou-o de propósito',
    body: 'O Excel guarda .xlsx num formato comprimido (ZIP), não em texto. Não é um bug. Em Excel: Ficheiro → Guardar como → CSV UTF-8. Depois importe esse .csv.',
  },
  content: {
    title: 'O conteúdo do ficheiro foi recusado',
    body: 'O ficheiro parece ter macros ou conteúdo que o Teglion não aceita. Exporte de novo para CSV de texto, sem macros.',
  },
  header: {
    title: 'O cabeçalho não corresponde ao modelo',
    body: 'Use «Modelo vazio» ou a exportação da carteira. As colunas nome e nif têm de existir na primeira linha.',
  },
  empty: {
    title: 'O ficheiro está vazio',
    body: 'Abra o modelo CSV, preencha pelo menos o nome ou o NIF numa linha e volte a importar.',
  },
  large: {
    title: 'O ficheiro é demasiado grande',
    body: 'O limite é 2 MB. Divida a carteira em vários CSV se precisar.',
  },
  generic: {
    title: 'Não foi possível importar este ficheiro',
    body: 'O Teglion só aceita CSV de texto. A Maya explica o caminho correcto no Excel.',
  },
}

function isExcelWorkbookName(name: string) {
  return /\.(xlsx|xlsm|xlsb|xls)$/i.test(name.trim())
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

function rejectKindFromError(err: unknown): CsvRejectKind {
  const code = getApiErrorCode(err)
  if (code === 'FILE_TOO_LARGE') return 'large'
  if (code === 'EMPTY_FILE') return 'empty'
  if (code === 'BAD_HEADER') return 'header'
  if (code === 'FILE_REJECTED') {
    const msg = getErrorMessage(err).toLowerCase()
    if (msg.includes('xlsx') || msg.includes('.xls') || msg.includes('macros')) return 'xlsx'
    return 'content'
  }
  return 'generic'
}

export function ClientsSpreadsheetDialog({ open, onOpenChange, onImported }: Props) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [rememberSession, setRememberSession] = useState(true)
  const [busy, setBusy] = useState<'export' | 'template' | 'import' | null>(null)
  const [rejectKind, setRejectKind] = useState<CsvRejectKind | null>(null)

  const reset = () => {
    setFile(null)
    setCurrentPassword('')
    setBusy(null)
    setRejectKind(null)
  }

  const explainRefusal = (kind: CsvRejectKind) => {
    setRejectKind(kind)
    setMayaFabVisible(true)
    openMaya('clients-csv')
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

  const onPickFile = (next: File | null) => {
    setFile(next)
    if (next && isExcelWorkbookName(next.name)) {
      explainRefusal('xlsx')
      return
    }
    setRejectKind(null)
  }

  const importFile = async () => {
    if (!file) {
      toast.error('Escolha um ficheiro .csv')
      return
    }
    if (isExcelWorkbookName(file.name)) {
      explainRefusal('xlsx')
      return
    }
    setBusy('import')
    try {
      const unlock = vaultUnlockPayload(
        user?.id,
        'vault_import',
        currentPassword.trim() || undefined,
        rememberSession,
      )
      const report = await contabilClientsApi.importClientsCsv(file, unlock)
      persistVaultStepUpFromResponse(user?.id, report, rememberSession, 'vault_import')
      const extra = report.errors.slice(0, 4).map((e) => `Linha ${e.line}: ${e.message}`)
      toast.success(
        `Importação concluída · ${report.created} criados · ${report.updated} actualizados · ${report.skipped} ignorados`,
        extra.length ? { description: extra.join(' · ') } : undefined,
      )
      reset()
      onOpenChange(false)
      onImported?.()
    } catch (err) {
      const kind = rejectKindFromError(err)
      explainRefusal(kind)
      toast.error(REJECT_COPY[kind].title, { description: getErrorMessage(err) })
    } finally {
      setBusy(null)
    }
  }

  const refusal = rejectKind ? REJECT_COPY[rejectKind] : null

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

          {refusal ? (
            <div
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2"
              role="alert"
              aria-live="polite"
              data-testid="clients-csv-rejected"
            >
              <p className="font-medium text-foreground">{refusal.title}</p>
              <p className="text-xs text-muted-foreground">{refusal.body}</p>
              <AskMayaButton intentId="clients-csv" className="h-8" />
            </div>
          ) : null}

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
              aria-label="Escolher ficheiro CSV"
              onChange={(e: ChangeEvent<HTMLInputElement>) => onPickFile(e.target.files?.[0] || null)}
            />
            <FormField
              label="Palavra-passe dos Acessos oficiais (só se o CSV tiver senhas de portais)"
              htmlFor="clients-csv-step-up"
            >
              <PasswordInput
                id="clients-csv-step-up"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Opcional se as colunas de senha estiverem vazias, ou se o cofre já estiver desbloqueado nesta sessão"
              />
            </FormField>
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={rememberSession}
                onChange={(e) => setRememberSession(e.target.checked)}
              />
              <span>Manter o cofre desbloqueado nesta sessão (não guarda a palavra-passe no browser).</span>
            </label>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              Ficheiros .xlsx, .xls e macros são recusados. Pedimos a palavra-passe dos Acessos
              oficiais — única daquele campo — quando o CSV traz senhas novas. Quem entra com Google
              também a cria em Definições → O seu perfil.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={Boolean(busy)}>
            Fechar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void importFile()}
            disabled={Boolean(busy) || !file || Boolean(rejectKind)}
          >
            <Upload className="h-4 w-4" />
            {busy === 'import' ? 'A importar…' : 'Importar CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
