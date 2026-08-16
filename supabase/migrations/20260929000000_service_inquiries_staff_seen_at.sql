-- Contador "não vistas" em Solicitações: staff_seen_at fica null até a equipa
-- abrir o detalhe; actividade do cliente (doc/resposta) volta a limpar o campo.

ALTER TABLE public.service_inquiries
  ADD COLUMN IF NOT EXISTS staff_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_service_inquiries_firm_unseen
  ON public.service_inquiries (firm_id)
  WHERE staff_seen_at IS NULL
    AND status NOT IN ('COMPLETED', 'CANCELLED');
