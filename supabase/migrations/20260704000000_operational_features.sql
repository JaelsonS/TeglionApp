-- ContaBil — funcionalidades operacionais (piloto PT)
-- Aplicar após migrations anteriores.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (validation_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_type TEXT;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS obligation_id UUID REFERENCES public.obligations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quick_reply_key TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_firm_last_login ON public.clients (firm_id, last_login_at);
CREATE INDEX IF NOT EXISTS idx_documents_firm_validation ON public.documents (firm_id, validation_status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_messages_firm_client_created ON public.messages (firm_id, client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_firm_scheduled ON public.consultations (firm_id, scheduled_at);
