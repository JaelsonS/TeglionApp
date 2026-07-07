-- Obrigações operacionais: modelos, recorrência, checklist e documentos esperados

-- Tipo SAF-T
ALTER TABLE public.obligations DROP CONSTRAINT IF EXISTS obligations_type_check;
ALTER TABLE public.obligations ADD CONSTRAINT obligations_type_check CHECK (
  type IN ('IVA', 'IRC', 'IRS', 'SS', 'DRF', 'IES', 'DAS', 'PAYROLL', 'SAFT', 'CUSTOM')
);

ALTER TABLE public.obligations
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS expected_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recurrence_rule_id UUID;

CREATE TABLE IF NOT EXISTS public.obligation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN ('IVA', 'IRC', 'IRS', 'SS', 'DRF', 'IES', 'DAS', 'PAYROLL', 'SAFT', 'CUSTOM')
  ),
  recurrence_frequency TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (
    recurrence_frequency IN ('NONE', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM')
  ),
  default_due_day INT NOT NULL DEFAULT 20 CHECK (default_due_day >= 1 AND default_due_day <= 28),
  default_priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (
    default_priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  default_amount_cents BIGINT,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_task_description TEXT,
  notify_on_create BOOLEAN NOT NULL DEFAULT true,
  create_client_task BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, code)
);

CREATE TABLE IF NOT EXISTS public.obligation_recurrence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.obligation_templates(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (
    frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM')
  ),
  last_period TEXT,
  next_period TEXT,
  next_due_date DATE,
  assigned_staff_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, client_id, template_id)
);

ALTER TABLE public.obligations
  DROP CONSTRAINT IF EXISTS obligations_template_id_fkey;
ALTER TABLE public.obligations
  ADD CONSTRAINT obligations_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.obligation_templates(id) ON DELETE SET NULL;

ALTER TABLE public.obligations
  DROP CONSTRAINT IF EXISTS obligations_recurrence_rule_id_fkey;
ALTER TABLE public.obligations
  ADD CONSTRAINT obligations_recurrence_rule_id_fkey
  FOREIGN KEY (recurrence_rule_id) REFERENCES public.obligation_recurrence_rules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_obligation_templates_firm ON public.obligation_templates (firm_id, is_active);
CREATE INDEX IF NOT EXISTS idx_obligation_recurrence_firm ON public.obligation_recurrence_rules (firm_id, is_active);
CREATE INDEX IF NOT EXISTS idx_obligations_due_status ON public.obligations (firm_id, due_date, status);
