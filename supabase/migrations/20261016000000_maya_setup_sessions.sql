-- Maya Setup (configuração rápida com IA) — sessões por escritório, sem PII além do questionário.

CREATE TABLE IF NOT EXISTS public.maya_setup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.firm_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generated', 'applied', 'cancelled')),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  proposal JSONB,
  generate_count INTEGER NOT NULL DEFAULT 0,
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maya_setup_sessions_firm_created
  ON public.maya_setup_sessions (firm_id, created_at DESC);

ALTER TABLE public.maya_setup_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS maya_setup_sessions_firm_staff ON public.maya_setup_sessions;
CREATE POLICY maya_setup_sessions_firm_staff ON public.maya_setup_sessions
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());
