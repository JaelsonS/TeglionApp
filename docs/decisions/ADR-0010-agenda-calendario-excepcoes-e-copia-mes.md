# ADR-0010 — Agenda: excepções diárias via calendário mensal e cópia de mês independente

## Status

Aceito. Decisão em vigor — implementada em 21/08/2026, como Fase 3 da evolução aprovada a partir da auditoria de 20/08/2026 (`docs/decisions/AUDITORIA_FASE0_EVOLUCAO_2026-08-20.md`).

## Contexto

A disponibilidade de agendamento do escritório já vivia em `firm.settings.booking` com dois eixos maduros:

- `schedule` — regras por dia da semana (vários intervalos por dia);
- `dateOverrides` — excepções por data civil (`YYYY-MM-DD`), onde `[]` significa dia fechado.

A prioridade `dateOverrides[data] ?? schedule[weekday]` já estava implementada em `computeAvailableSlotsTz` (`booking.service.js`). A UI, porém, listava excepções como inputs de data manuais — sem calendário clicável, sem dialog por dia, e sem «copiar mês». Overrides por serviço (`accounting_services.booking_overrides.dateOverrides`) já eram aceites no backend, mas a UI de «Disponibilidade por serviço» só expunha `schedule`/`weekdays`.

## Decisão

1. **Reutilizar o modelo existente** — sem migration nova. Excepções continuam em JSON em `settings.booking.dateOverrides` (firma) e em `booking_overrides.dateOverrides` (serviço).
2. **UI mensal reutilizando `CalendarMonthGrid`** — o mesmo componente do Calendário Fiscal. Clique num dia abre `AgendaDayAvailabilityDialog` (Dialog centralizado, mesmo padrão de `FiscalEventFormDialog` / `TaskEditDialog`): herdar horário semanal, fechar o dia, ou definir intervalos especiais; copiar de outro dia; limpar (voltar ao semanal).
3. **«Copiar mês» com cópia profunda** — função pura `copyMonthDateOverrides` no frontend e no backend. Copia `YYYY-MM` → outro `YYYY-MM`, substitui as chaves do mês de destino, clona intervalos em profundidade. Alterar Setembro depois da cópia não muta Agosto. O backend aceita `PATCH /booking-settings` com `{ copyMonth: { from, to } }` além do patch directo de `dateOverrides`.
4. **Serviços** — `AgendaServiceHoursPanel` passa a editar e persistir `dateOverrides` por serviço via o mesmo painel; no dialog do horário geral, um resumo informativo mostra a disponibilidade efectiva de cada serviço bookable naquele dia.

## Alternativas consideradas

- **Tabela SQL `booking_date_overrides`.** Descartada: o modelo JSON já é a fonte de verdade usada pelo cálculo de slots; uma tabela nova duplicaria a regra sem ganho real no volume actual.
- **Calendário próprio da Agenda (`AgendaMonthGrid`).** Descartado: `CalendarMonthGrid` já é o componente genérico documentado para este caso; inventar outro grelha quebraria a regra de reutilização da auditoria.
- **Cópia só no cliente.** Insuficiente sozinha: o pedido exige validação de independência também no backend — daí a função pura exportada e o ramo `copyMonth` em `updateBookingSettings`.

## Consequências positivas

- UX alinhada ao pedido (mês → dia → dialog) sem nova fonte de verdade.
- Independência entre meses testável (unitário frontend + backend).
- Overrides por serviço deixam de ser «meio expostos».

## Consequências negativas / dívidas

- `dateOverrides` continua num blob JSON — queries SQL por data de excepção não são naturais (aceitável no volume actual).
- A cópia de mês no UI actualiza o estado local; a persistência só ocorre quando o utilizador guarda a disponibilidade (comportamento igual ao resto do painel).
- Resumo «serviços neste dia» no dialog é informativo, não um editor multi-serviço no mesmo dialog.

## Relação com outros ADRs

- Não altera o isolamento por `firm_id` (ADR-0001): settings e `booking_overrides` já são por escritório.
- Google Calendar fica na **Fase 9** desta frente ([ADR-0012](./ADR-0012-ordem-frente-evolucao-produto.md)), não imediatamente após Agenda — continua fora deste ADR; a disponibilidade local não muda o sync.
- Dívida UX conhecida (21/08/2026): o calendário de excepções na UI antiga ficava cortado / com scroll aninhado frágil (`cb-fiscal-cal-grid-wrap`). **Corrigido na mesma data** com layout em 3 colunas alinhado ao mockup `docs/product/mockups/agenda-horario-geral-mockup.png` (horário semanal em linhas + calendário sem overflow aninhado + opções laterais).
