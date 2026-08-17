type IntakeStartMode = 'form' | 'calendar'

type Props = {
  requiresBooking: boolean
  value: IntakeStartMode
  onChange: (value: IntakeStartMode) => void
}

export function IntakeStartModeFields({ requiresBooking, value, onChange }: Props) {
  if (!requiresBooking) return null

  return (
    <fieldset className="space-y-2 rounded-xl border border-brand/15 bg-muted/20 p-3">
      <legend className="px-1 text-sm font-medium">Como o cliente inicia este serviço?</legend>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="radio"
          className="mt-0.5"
          name="intake-start-mode"
          checked={value !== 'calendar'}
          onChange={() => onChange('form')}
        />
        <span>
          Formulário primeiro
          <span className="block text-xs text-muted-foreground">
            Nome, contacto e perguntas — depois o horário. É o comportamento actual.
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="radio"
          className="mt-0.5"
          name="intake-start-mode"
          checked={value === 'calendar'}
          onChange={() => onChange('calendar')}
        />
        <span>
          Agenda primeiro
          <span className="block text-xs text-muted-foreground">
            O cliente vê os horários logo, reserva temporariamente, e só depois preenche os dados.
          </span>
        </span>
      </label>
    </fieldset>
  )
}
