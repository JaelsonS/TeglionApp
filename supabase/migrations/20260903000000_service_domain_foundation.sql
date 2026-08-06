-- Fase 1 — Service Domain Foundation
-- Ver docs/product/SPRINT_PLAYBOOK.md e a especificação técnica da Fase 1
-- (plan file da sessão que criou isto) para o racional completo de cada decisão.
--
-- Service (accounting_services, estendida) é o conceito central. Lead é uma
-- identidade que ainda não é cliente. ServiceInquiry é o pivô que liga um
-- Lead OU um Client a um Service, com um estado. Nenhuma categoria hardcoded
-- (IRS/ONE_OFF/etc.) — cada escritório define os seus próprios Services.
--
-- NOTA IMPORTANTE: já existe uma tabela `service_requests` em produção
-- (migration 20260825000000_service_requests.sql, "Central de Serviços") —
-- pipeline de orçamento/pagamento para CLIENTES já existentes (client_id
-- NOT NULL, sem conceito de Lead). É uma ferramenta diferente e complementar,
-- não tocada por esta migration. Por isso o pivô novo desta fase chama-se
-- `service_inquiries` (não `service_requests`) — evita colisão de nome e de
-- responsabilidade com algo já ao vivo. Um Lead convertido pode, mais tarde,
-- gerar um `service_requests` normal na Central de Serviços já existente.

-- ============================================================
-- 1) accounting_services — estender (aditivo, zero-downtime)
-- ============================================================

ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_publicly_listed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_booking BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS document_requirements JSONB NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounting_services_public_needs_slug'
  ) THEN
    ALTER TABLE public.accounting_services
      ADD CONSTRAINT accounting_services_public_needs_slug
      CHECK (is_publicly_listed = false OR slug IS NOT NULL);
  END IF;
END $$;

-- Índice único (firm_id, slug) — Postgres não trata múltiplos NULL como conflito,
-- então serviços privados sem slug convivem sem problema.
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounting_services_firm_slug
  ON public.accounting_services (firm_id, slug);

-- Índice parcial barato, prepara a listagem pública da Fase 5 sem custo agora.
CREATE INDEX IF NOT EXISTS idx_accounting_services_public
  ON public.accounting_services (firm_id)
  WHERE is_publicly_listed AND is_active;

-- ============================================================
-- 2) leads — identidade que ainda não é cliente
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'PUBLIC_FORM', 'IMPORT')),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISMISSED')),
  consent_marketing BOOLEAN,
  converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_firm_status ON public.leads (firm_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_firm_email ON public.leads (firm_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_firm_tax_id ON public.leads (firm_id, tax_id) WHERE tax_id IS NOT NULL;

-- Índices de matching em clients (podem já existir; IF NOT EXISTS protege).
CREATE INDEX IF NOT EXISTS idx_clients_firm_email_lower ON public.clients (firm_id, lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_firm_tax_id ON public.clients (firm_id, tax_id) WHERE tax_id IS NOT NULL;

-- ============================================================
-- 3) service_inquiries — o pivô operacional da fase de captação
--    (distinto de `service_requests`, a Central de Serviços já existente)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.accounting_services(id) ON DELETE RESTRICT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (
    status IN ('NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  assigned_staff_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT service_inquiries_requester_xor CHECK (
    (lead_id IS NOT NULL AND client_id IS NULL) OR
    (lead_id IS NULL AND client_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_service_inquiries_firm_status ON public.service_inquiries (firm_id, status);
CREATE INDEX IF NOT EXISTS idx_service_inquiries_firm_service ON public.service_inquiries (firm_id, service_id);
CREATE INDEX IF NOT EXISTS idx_service_inquiries_lead ON public.service_inquiries (lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_service_inquiries_client ON public.service_inquiries (client_id) WHERE client_id IS NOT NULL;

-- ============================================================
-- 4) RLS — mesmo padrão de todo o resto do schema (defesa em profundidade;
--    decorativo enquanto o backend usar service_role, mantido por consistência
--    e como preparação para RLS efectivo via JWT Supabase, ver SECURITY.md)
-- ============================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_firm_staff ON public.leads;
CREATE POLICY leads_firm_staff ON public.leads
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS service_inquiries_firm_staff ON public.service_inquiries;
CREATE POLICY service_inquiries_firm_staff ON public.service_inquiries
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- ============================================================
-- Down-migration (não executado automaticamente — documentado para rollback manual
-- seguindo a estratégia de docs/operations/DEPLOY_PRODUCTION.md):
--
-- DROP TABLE IF EXISTS public.service_inquiries;
-- DROP TABLE IF EXISTS public.leads;
-- ALTER TABLE public.accounting_services
--   DROP CONSTRAINT IF EXISTS accounting_services_public_needs_slug,
--   DROP COLUMN IF EXISTS slug,
--   DROP COLUMN IF EXISTS is_publicly_listed,
--   DROP COLUMN IF EXISTS requires_booking,
--   DROP COLUMN IF EXISTS document_requirements;
-- DROP INDEX IF EXISTS idx_accounting_services_firm_slug;
-- DROP INDEX IF EXISTS idx_accounting_services_public;
-- ============================================================
