-- Validade de documentos (ex.: certidão permanente) + dedup de lembretes
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS valid_from DATE,
  ADD COLUMN IF NOT EXISTS valid_until DATE;

CREATE INDEX IF NOT EXISTS idx_documents_valid_until_active
  ON public.documents (firm_id, valid_until)
  WHERE is_active = true AND valid_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.document_reminder_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'email_client', 'in_app_firm', 'in_app_client')),
  day_bucket DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, channel, day_bucket)
);

CREATE INDEX IF NOT EXISTS idx_document_reminder_sends_firm_day
  ON public.document_reminder_sends (firm_id, day_bucket);
