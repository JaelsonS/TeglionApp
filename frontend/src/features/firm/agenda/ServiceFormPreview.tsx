import type { IntakeForm, IntakeQuestionType } from '@/shared/types/contabil'
import { RichTextEditor } from '@/shared/design-system/RichTextEditor'

const QUESTION_TYPE_LABELS: Record<IntakeQuestionType, string> = {
  text: 'Texto livre',
  short_text: 'Texto curto',
  long_text: 'Texto longo',
  email: 'Email',
  phone: 'Telefone',
  tax_id: 'NIF',
  date: 'Data',
  single_choice: 'Escolha única',
  multiple_choice: 'Escolha múltipla',
  yes_no: 'Sim / Não',
}

type Props = {
  serviceName?: string | null
  description?: string | null
  onDescriptionChange?: (html: string) => void
  requiresBooking: boolean
  intakeStartMode?: 'form' | 'calendar'
  intakeForm: IntakeForm
  imageUrl?: string | null
}

/**
 * Pré-visualização estática do que a página pública vai mostrar — sem
 * chamada de rede, sem submissão, alimentada só pelo estado local já
 * editado. A descrição usa o mesmo RichTextEditor controlado da edição.
 */
export function ServiceFormPreview({
  serviceName,
  description,
  onDescriptionChange,
  requiresBooking,
  intakeStartMode = 'form',
  intakeForm,
  imageUrl,
}: Props) {
  const calendarFirst = requiresBooking && intakeStartMode === 'calendar'
  const bookingHint = (
    <p className="border-t border-border/40 pt-3 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Horário *</span>
      {calendarFirst
        ? ' — o cliente vê a disponibilidade primeiro e só depois preenche os dados.'
        : ' — o cliente escolhe entre os horários disponíveis do escritório (ou deste serviço, se personalizados)'}
    </p>
  )

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Pré-visualização — é assim que o cliente vai ver a página pública. Nada aqui é enviado.
      </p>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="max-h-40 w-full rounded-xl object-cover" />
      ) : null}
      <header className="space-y-2">
        <h2 className="text-lg font-bold">{serviceName || 'Nome do serviço'}</h2>
        {onDescriptionChange ? (
          <RichTextEditor
            value={description || ''}
            onChange={onDescriptionChange}
            placeholder="Descrição que o cliente vê…"
          />
        ) : description ? (
          <RichTextEditor value={description} onChange={() => undefined} readOnly />
        ) : null}
      </header>

      <div className="space-y-3 rounded-2xl border border-border/50 bg-card p-4">
        {calendarFirst ? bookingHint : null}
        <div className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
          <p>Nome *</p>
          <p>NIF</p>
          <p>Email</p>
          <p>Telefone</p>
        </div>

        {!calendarFirst && requiresBooking ? bookingHint : null}

        {intakeForm.questions.length === 0 ? (
          <p className="border-t border-border/40 pt-3 text-sm text-muted-foreground">
            Sem perguntas adicionais — a página pede só nome e contacto.
          </p>
        ) : (
          intakeForm.questions.map((q, index) => (
            <div key={q.id ?? index} className="space-y-0.5 border-t border-border/40 pt-3">
              <p className="text-sm font-medium">
                {q.label || '(pergunta sem texto)'}
                {q.required ? ' *' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {QUESTION_TYPE_LABELS[q.type]}
                {q.options?.length ? ` — ${q.options.map((o) => o.label).join(', ')}` : ''}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
