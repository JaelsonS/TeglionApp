-- Bloqueia double-booking no banco. Hoje a checagem de disponibilidade e a
-- criação da consultation (booking.service.js#bookAsClient e
-- connect-payments.service.js#bookAndPayAsClient) são check-then-insert sem
-- proteção — duas requisições simultâneas para o mesmo horário podem ambas
-- passar na checagem e ambas inserir. Isto é ainda mais sério no fluxo pago
-- via Stripe Connect, onde envolve dinheiro real.
--
-- Verificado antes de escrever esta migration (backend/scripts/check-consultation-overlaps.js)
-- que não há sobreposição existente nos dados atuais — a constraint pode ser
-- criada sem falhar.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- staff_id NULL vira o sentinel abaixo: sem isto, duas reservas públicas sem
-- staff atribuído (o caso mais comum hoje) nunca colidiriam entre si, porque
-- NULL nunca é igual a NULL num exclusion constraint.
ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_no_overlap
  EXCLUDE USING gist (
    firm_id WITH =,
    COALESCE(staff_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
    tstzrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval, '[)') WITH &&
  )
  WHERE (status IN ('PENDING_PAYMENT', 'SCHEDULED'));

COMMENT ON CONSTRAINT consultations_no_overlap ON public.consultations IS
  'Impede duas consultations ativas (mesmo firm+staff) com horário sobreposto. Violação = erro 23P01, tratado em booking.service.js e connect-payments.service.js como 409.';

-- Rollback (documentação):
-- ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_no_overlap;
