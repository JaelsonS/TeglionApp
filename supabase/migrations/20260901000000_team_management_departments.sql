-- Sprint 0.9 — Gestão de Equipas: departamentos + metadados de membro

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, name)
);

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_status TEXT NOT NULL DEFAULT 'ACCEPTED' CHECK (invite_status IN ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'));

CREATE INDEX IF NOT EXISTS idx_departments_firm_active
  ON public.departments (firm_id, is_active);

CREATE INDEX IF NOT EXISTS idx_departments_firm_name
  ON public.departments (firm_id, name);

CREATE INDEX IF NOT EXISTS idx_firm_users_firm_role
  ON public.firm_users (firm_id, role);

CREATE INDEX IF NOT EXISTS idx_firm_users_firm_department
  ON public.firm_users (firm_id, department_id);

CREATE INDEX IF NOT EXISTS idx_firm_users_firm_active
  ON public.firm_users (firm_id, is_active);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS departments_firm_staff_select ON public.departments;
CREATE POLICY departments_firm_staff_select ON public.departments
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS departments_firm_manage ON public.departments;
CREATE POLICY departments_firm_manage ON public.departments
  FOR ALL
  USING (
    firm_id = public.current_firm_id()
    AND public.is_firm_staff()
    AND COALESCE(auth.jwt() ->> 'role', '') IN ('FIRM_OWNER', 'FIRM_STAFF')
  )
  WITH CHECK (
    firm_id = public.current_firm_id()
    AND public.is_firm_staff()
    AND COALESCE(auth.jwt() ->> 'role', '') IN ('FIRM_OWNER', 'FIRM_STAFF')
  );
