-- IRS Vertical Slice — especificação técnica na sessão que criou isto
-- (plan file v4, ver docs/product/SPRINT_PLAYBOOK.md para o contexto da iniciativa).
--
-- Corte vertical do fluxo IRS de ponta a ponta: Service já define um
-- intake_form (perguntas), a submissão pública grava as respostas cruas em
-- service_inquiries.answers e gera um access_token opaco para o mini-portal
-- sem login onde o Lead/Client envia os documentos pedidos.
--
-- service_inquiry_documents é uma tabela nova e pequena — não reaproveita a
-- tabela `documents` porque esta exige client_id em todo o código que a usa
-- (dashboards, checks de duplicado, portal do cliente); um Lead recém-criado
-- ainda não é Client, e forçar client_id obrigaria a converter Lead→Client
-- automaticamente na submissão, contradizendo a decisão da Fase 1 (conversão
-- manual e auditada).

-- ============================================================
-- 1) accounting_services — intake_form (aditivo)
-- ============================================================

ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS intake_form JSONB;

-- ============================================================
-- 2) service_inquiries — respostas da submissão + token do mini-portal
-- ============================================================

ALTER TABLE public.service_inquiries
  ADD COLUMN IF NOT EXISTS answers JSONB,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_inquiries_access_token
  ON public.service_inquiries (access_token)
  WHERE access_token IS NOT NULL;

-- ============================================================
-- 3) service_inquiry_documents — documentos entregues pelo Lead/Client
--    através do mini-portal por token (sem login)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_inquiry_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  service_inquiry_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  title TEXT NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'supabase',
  storage_key TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_inquiry_documents_inquiry
  ON public.service_inquiry_documents (service_inquiry_id);
CREATE INDEX IF NOT EXISTS idx_service_inquiry_documents_firm
  ON public.service_inquiry_documents (firm_id);

ALTER TABLE public.service_inquiry_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_inquiry_documents_firm_staff ON public.service_inquiry_documents;
CREATE POLICY service_inquiry_documents_firm_staff ON public.service_inquiry_documents
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- ============================================================
-- Down-migration (não executado automaticamente — documentado para rollback manual
-- seguindo a estratégia de docs/operations/DEPLOY_PRODUCTION.md):
--
-- DROP TABLE IF EXISTS public.service_inquiry_documents;
-- DROP INDEX IF EXISTS idx_service_inquiries_access_token;
-- ALTER TABLE public.service_inquiries
--   DROP COLUMN IF EXISTS answers,
--   DROP COLUMN IF EXISTS submitted_at,
--   DROP COLUMN IF EXISTS access_token;
-- ALTER TABLE public.accounting_services
--   DROP COLUMN IF EXISTS intake_form;
-- ============================================================
