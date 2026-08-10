-- Fase 2a — ciclo de comunicação: materializar o checklist (ver especificação
-- da sessão, v8, secção 2).
--
-- Até agora, os documentos pedidos numa ServiceInquiry eram sempre recalculados
-- em memória (resolveRequiredDocuments()) a cada leitura — nunca persistidos.
-- Isto tornava impossível a contabilista pedir "mais uma coisa" depois da
-- submissão inicial (não havia onde guardar esse pedido extra) ou pedir uma
-- resposta em texto (só documentos eram um conceito modelado).
--
-- service_inquiry_requests unifica os dois: cada linha é UM pedido — de
-- documento ou de resposta em texto — com estado (PENDING/ANSWERED). O
-- checklist inicial (resolveRequiredDocuments(), inalterada) passa a ser
-- materializado aqui na submissão; pedidos adicionados pela equipa depois
-- entram na mesma tabela, mesma UI, mesmo histórico.

CREATE TABLE IF NOT EXISTS public.service_inquiry_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  service_inquiry_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('document', 'question')),
  tag TEXT,
  title TEXT NOT NULL,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ANSWERED')),
  -- Resposta em texto do cliente — encriptada (enc:v1), mesma razão de
  -- service_inquiries.answers_enc (Fase 1b): pode conter dados pessoais.
  text_reply_enc TEXT,
  document_id UUID REFERENCES public.service_inquiry_documents(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT service_inquiry_requests_document_needs_tag CHECK (kind != 'document' OR tag IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_service_inquiry_requests_inquiry
  ON public.service_inquiry_requests (service_inquiry_id);
CREATE INDEX IF NOT EXISTS idx_service_inquiry_requests_firm
  ON public.service_inquiry_requests (firm_id);

ALTER TABLE public.service_inquiry_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_inquiry_requests_firm_staff ON public.service_inquiry_requests;
CREATE POLICY service_inquiry_requests_firm_staff ON public.service_inquiry_requests
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- ============================================================
-- Down-migration (não executado automaticamente — rollback manual):
--
-- DROP TABLE IF EXISTS public.service_inquiry_requests;
-- ============================================================
