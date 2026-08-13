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
--
-- Nota (Sprint 0 / staging): a expressão inline
--   COALESCE(staff_id, …) / tstzrange(scheduled_at, scheduled_at + interval)
-- falha em alguns Postgres/Supabase com 42P17 (function is not IMMUTABLE).
-- Helpers SQL IMMUTABLE resolvem isso. São matematicamente determinísticos
-- para os inputs usados (UUID COALESCE; duração em minutos fixos → offset
-- absoluto em segundos, independente de TimeZone de sessão).

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE OR REPLACE FUNCTION public.consultation_staff_key(p_staff_id uuid)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT COALESCE(p_staff_id, '00000000-0000-0000-0000-000000000000'::uuid);
$$;

CREATE OR REPLACE FUNCTION public.consultation_time_range(
  p_scheduled_at timestamptz,
  p_duration_minutes integer
)
RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT tstzrange(
    p_scheduled_at,
    p_scheduled_at + (COALESCE(p_duration_minutes, 60) * interval '1 minute'),
    '[)'
  );
$$;

COMMENT ON FUNCTION public.consultation_staff_key(uuid) IS
  'Sentinel para staff_id NULL em exclusion constraint (NULL ≠ NULL). IMMUTABLE: só COALESCE de UUID.';

COMMENT ON FUNCTION public.consultation_time_range(timestamptz, integer) IS
  'Range [start, start+duration) para exclusion. IMMUTABLE na prática: intervalo em minutos é absoluto (não depende de TimeZone).';

-- staff_id NULL vira o sentinel via consultation_staff_key: sem isto, duas
-- reservas públicas sem staff atribuído nunca colidiriam entre si.
ALTER TABLE public.consultations
  DROP CONSTRAINT IF EXISTS consultations_no_overlap;

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_no_overlap
  EXCLUDE USING gist (
    firm_id WITH =,
    public.consultation_staff_key(staff_id) WITH =,
    public.consultation_time_range(scheduled_at, duration_minutes) WITH &&
  )
  WHERE (status IN ('PENDING_PAYMENT', 'SCHEDULED'));

COMMENT ON CONSTRAINT consultations_no_overlap ON public.consultations IS
  'Impede duas consultations ativas (mesmo firm+staff) com horário sobreposto. Violação = erro 23P01, tratado em booking.service.js e connect-payments.service.js como 409.';

-- Rollback (documentação):
-- ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_no_overlap;
-- DROP FUNCTION IF EXISTS public.consultation_time_range(timestamptz, integer);
-- DROP FUNCTION IF EXISTS public.consultation_staff_key(uuid);
