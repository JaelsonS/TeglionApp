# Booking / Agendamento

**Status: IMPLEMENTADO.** O motor de disponibilidade, os holds, o overlap na base de dados e a sincronização com o Google Calendar estão em produção. Este documento descreve o sistema **real**, não um desenho futuro.

## Papéis

- **Horário geral do escritório** — `firms.settings.booking`. Predefinição para todos os serviços.
- **Override por serviço** — `accounting_services.booking_overrides`. Restringe (ou altera) os dias e intervalos em que **aquele** serviço pode ser marcado. `null` = herda o horário geral.
- **Duração da sessão** — `accounting_services.duration_minutes`. É a duração real da consulta, não o passo da grelha.
- **Passo da grelha** — `slotMinutes` no horário geral (o override pode, em teoria, sobrepor este campo; a UI de serviço só grava `schedule` + `weekdays`).
- **Google Calendar** — um calendário de staff da firma (`googleCalendarStaffUserId`). Lê busy e escreve eventos. Não há um calendário por serviço.
- **Calendário da Agenda** — o mesmo recurso partilhado. Uma marcação num serviço ocupa o horário para os outros.

Isto **não** é um sistema de disponibilidade individual por contabilista.

## Fluxo público

Página pública do escritório → serviço → o backend gera slots (`listSlotsForBooking`) → o cliente escolhe um horário → hold anónimo (se o serviço começa pelo calendário) e/ou checkout Stripe Connect (se o pagamento é obrigatório) → `consultations` em `SCHEDULED` ou `PENDING_PAYMENT` → email de confirmação → evento no Google Calendar de quem atende.

O frontend público (`PublicSlotCalendar`, `ClientBookingPanel`, `groupBookingSlots`) **só agrupa e apresenta** os ISO que o backend devolve. Não recalcula disponibilidade.

## Herança

```text
firms.settings.booking
        ↓
booking_overrides do serviço (parcial, campo a campo)
        ↓
normalizeBooking()
        ↓
listSlotsForBooking()
        ↓
computeAvailableSlotsTz()
        ↓
slots públicos
```

### Sem override

`booking_overrides = null` → o serviço usa o horário geral.

Exemplo: firma segunda–sexta 09:00–17:00, serviço sem override → segunda–sexta 09:00–17:00.

### Com override

O objecto é **parcial**. Campos ausentes continuam a vir da firma (`slotMinutes`, `horizonDays`, `leadTimeHours`, `timezone`, `dateOverrides`, etc.).

Exemplo gravado pelo editor:

```json
{
  "weekdays": [1, 3],
  "schedule": {
    "1": [{ "start": "09:00", "end": "12:00" }, { "start": "14:00", "end": "17:00" }],
    "3": [{ "start": "14:00", "end": "17:00" }]
  }
}
```

Resultado: segunda e quarta nos intervalos indicados; os outros dias fechados **para este serviço**. Terça da firma não “passa” para o serviço, porque o `schedule` do override substitui o da firma e o `weekdays` filtra.

Um override só com `weekdays: [2]` (sem `schedule`) filtra o horário geral às terças — o merge em `normalizeSchedule` está desenhado para isso.

`PATCH` do serviço **sem** `bookingOverrides` não altera o valor existente. `bookingOverrides: null` remove o override e volta a herdar.

## Duração vs slotMinutes

- `slotMinutes` = passo entre inícios possíveis (ex.: 30).
- `durationMinutes` = quanto tempo a sessão ocupa.

Exemplo: intervalo 09:00–11:00, `slotMinutes = 30`, `durationMinutes = 90` gera 09:00 e 09:30 (09:00+90 cabe; 10:00+90 já não). O motor não arranca um slot cujo fim saia do intervalo.

A reunião criada na Agenda pelo escritório resolve a duração **no backend** a partir do serviço autorizado da firma (`findByIdForFirm`). O `durationMinutes` enviado pelo browser é ignorado quando há `accountingServiceId`. Um id de outro tenant devolve 404.

## Holds, overlap e corrida

Disponibilidade e criação **não** dependem só de uma leitura prévia. A base de dados impede duas reservas activas no mesmo recurso/horário:

- `consultations_no_overlap` (consultas `PENDING_PAYMENT` / `SCHEDULED`)
- `booking_holds_no_overlap` (holds anónimos)

Violação PostgreSQL `23P01` é traduzida para HTTP 409 em:

- `booking.service.js` (`bookAsClient`, `createAnonymousHold`)
- `connect-payments.service.js` (checkout)
- `consultations.service.js` (reunião manual da Agenda)

Holds activos entram na lista de busy de `listSlotsForBooking` (excepto o `ignoreHoldToken` do próprio visitante). Consultas `PENDING_PAYMENT` e `SCHEDULED` também. Dois pedidos simultâneos no mesmo horário: um grava, o outro recebe 409.

## Google Calendar

- Leitura de busy: `googleCalendarAvailabilityService.getBusyRangesForFirm` (falha aberta — uma integração caída não derruba a página de slots).
- Escrita: sync fire-and-forget após booking / reunião / cancelamento.
- Timezone: o fuso de `firms.settings.booking`.
- Continua a usar `googleCalendarStaffUserId` da firma, não um calendário por serviço.

O Google diz “quando há indisponibilidade externa”. O serviço diz “em que dias este tipo de marcação é oferecido”.

## Onde a contabilista configura

1. **Agenda → Definições → Horário geral do escritório** — `GET/PATCH /contabil/booking-settings`.
2. **Agenda → Definições → Disponibilidade por serviço** — lista quem herda e quem tem horário próprio; grava `booking_overrides`.
3. **Serviços → editor do serviço → Disponibilidade para marcação** — o mesmo campo. Ao activar «Personalizar horários deste serviço», o editor semeia a partir do horário **real** da firma (não um 09:00–17:00 hardcoded).

`AgendaServicesCatalogPanel` ainda contém um interruptor antigo com default 09:00–17:00, mas **não está montado** em nenhum ecrã. Não foi removido.

## Isolamento entre escritórios

A página pública resolve o escritório pelo slug, nunca por um id que o visitante possa trocar. `listSlotsForBooking` e `bookAsClient` usam `findByIdForFirm`. A reunião manual da Agenda só aceita `accountingServiceId` da mesma firma.

## Cancelamento

Hoje só pelo escritório. Não há autocancelamento / reagendamento pelo cliente na página pública. O cancelamento remove o evento correspondente no Google Calendar.

## Resposta directa

**O booking aguenta dois clientes no mesmo horário ao mesmo tempo?** A constraint de exclusão na base de dados impede duas consultas activas sobrepostas no mesmo `firm_id` + `staff_id`. O segundo pedido falha com 409. Holds têm a mesma protecção. Isto não substitui a leitura de slots — complementa-a contra a corrida.
