-- Calendário Fiscal configurável por escritório.
-- Modelo: cópias do firm (Teglion fornece template PT via import).
-- Datas = DATE (dia civil, sem timezone). Soft-delete via archived_at / is_active.

CREATE TABLE IF NOT EXISTS public.firm_fiscal_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Calendário Fiscal',
  description TEXT,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id)
);

CREATE TABLE IF NOT EXISTS public.firm_fiscal_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES public.firm_fiscal_calendars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_token TEXT NOT NULL DEFAULT 'slate',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (calendar_id, name)
);

CREATE INDEX IF NOT EXISTS idx_firm_fiscal_categories_firm
  ON public.firm_fiscal_categories (firm_id, is_active);

CREATE TABLE IF NOT EXISTS public.firm_fiscal_recurrence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM')),
  interval_count INT NOT NULL DEFAULT 1 CHECK (interval_count >= 1 AND interval_count <= 52),
  day_of_month INT CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
  day_of_week INT CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  month_of_year INT CHECK (month_of_year IS NULL OR (month_of_year >= 1 AND month_of_year <= 12)),
  until_date DATE,
  count_limit INT CHECK (count_limit IS NULL OR count_limit > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.firm_fiscal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES public.firm_fiscal_calendars(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.firm_fiscal_categories(id) ON DELETE SET NULL,
  recurrence_rule_id UUID REFERENCES public.firm_fiscal_recurrence_rules(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  start_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_kind TEXT NOT NULL DEFAULT 'FISCAL' CHECK (event_kind IN ('FISCAL', 'INTERNAL')),
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (
    status IN ('SCHEDULED', 'PENDING', 'COMPLETED', 'CANCELLED', 'ARCHIVED')
  ),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  color_token TEXT,
  authority TEXT,
  period_label TEXT,
  regimes TEXT[] NOT NULL DEFAULT '{}',
  source_template_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_fiscal_events_firm_date
  ON public.firm_fiscal_events (firm_id, start_date)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_firm_fiscal_events_calendar
  ON public.firm_fiscal_events (calendar_id, is_active);

CREATE INDEX IF NOT EXISTS idx_firm_fiscal_events_template
  ON public.firm_fiscal_events (firm_id, source_template_key)
  WHERE source_template_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.firm_fiscal_event_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.firm_fiscal_events(id) ON DELETE CASCADE,
  original_date DATE NOT NULL,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  override_date DATE,
  override_title TEXT,
  override_description TEXT,
  override_status TEXT CHECK (
    override_status IS NULL OR override_status IN ('SCHEDULED', 'PENDING', 'COMPLETED', 'CANCELLED', 'ARCHIVED')
  ),
  override_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, original_date)
);

CREATE INDEX IF NOT EXISTS idx_firm_fiscal_event_exceptions_event
  ON public.firm_fiscal_event_exceptions (event_id);

CREATE TABLE IF NOT EXISTS public.firm_fiscal_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.firm_fiscal_events(id) ON DELETE CASCADE,
  days_before INT NOT NULL DEFAULT 7 CHECK (days_before >= 0 AND days_before <= 365),
  channel TEXT NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_fiscal_reminders_event
  ON public.firm_fiscal_reminders (event_id, is_active);

-- RLS (defense-in-depth; backend uses service_role)
ALTER TABLE public.firm_fiscal_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_fiscal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_fiscal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_fiscal_recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_fiscal_event_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_fiscal_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS firm_fiscal_calendars_staff ON public.firm_fiscal_calendars;
CREATE POLICY firm_fiscal_calendars_staff ON public.firm_fiscal_calendars
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS firm_fiscal_categories_staff ON public.firm_fiscal_categories;
CREATE POLICY firm_fiscal_categories_staff ON public.firm_fiscal_categories
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS firm_fiscal_events_staff ON public.firm_fiscal_events;
CREATE POLICY firm_fiscal_events_staff ON public.firm_fiscal_events
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS firm_fiscal_recurrence_rules_staff ON public.firm_fiscal_recurrence_rules;
CREATE POLICY firm_fiscal_recurrence_rules_staff ON public.firm_fiscal_recurrence_rules
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS firm_fiscal_event_exceptions_staff ON public.firm_fiscal_event_exceptions;
CREATE POLICY firm_fiscal_event_exceptions_staff ON public.firm_fiscal_event_exceptions
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS firm_fiscal_reminders_staff ON public.firm_fiscal_reminders;
CREATE POLICY firm_fiscal_reminders_staff ON public.firm_fiscal_reminders
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback (documentação):
-- DROP TABLE IF EXISTS public.firm_fiscal_reminders;
-- DROP TABLE IF EXISTS public.firm_fiscal_event_exceptions;
-- DROP TABLE IF EXISTS public.firm_fiscal_events;
-- DROP TABLE IF EXISTS public.firm_fiscal_recurrence_rules;
-- DROP TABLE IF EXISTS public.firm_fiscal_categories;
-- DROP TABLE IF EXISTS public.firm_fiscal_calendars;
