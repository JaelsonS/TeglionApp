-- Fase 3a — Lead booking real (ver plan file da sessão, v8, secção 3).
-- Até agora, consultations.client_id era obrigatório: um Lead que reservava um
-- horário na página pública nunca criava uma consulta real, só uma nota de
-- texto ("Horário pretendido: ..."), sem bloquear o slot para ninguém.
-- Esta migration permite que uma consultation pertença a um Lead OU a um
-- Client (nunca os dois, nunca nenhum), mesmo padrão XOR já usado e já
-- provado em service_inquiries desde a Fase 1 — aditiva, não apaga nem migra
-- nenhuma linha existente (todas já têm client_id preenchido, continuam a
-- satisfazer a constraint tal como estão).

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

ALTER TABLE public.consultations
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.consultations
  DROP CONSTRAINT IF EXISTS consultations_holder_xor;

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_holder_xor CHECK (
    (client_id IS NOT NULL AND lead_id IS NULL) OR
    (client_id IS NULL AND lead_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_consultations_lead_id ON public.consultations (lead_id) WHERE lead_id IS NOT NULL;

-- Rollback (não executável, documentação apenas — mesmo padrão já usado desde a Fase 1):
-- ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_holder_xor;
-- DROP INDEX IF EXISTS idx_consultations_lead_id;
-- ALTER TABLE public.consultations DROP COLUMN IF EXISTS lead_id;
-- ALTER TABLE public.consultations ALTER COLUMN client_id SET NOT NULL; -- só seguro se nenhuma linha lead_id-only existir
