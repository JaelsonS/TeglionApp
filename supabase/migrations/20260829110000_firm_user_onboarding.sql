-- Onboarding escritório: checklist pós-registo
ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.firm_users.onboarding_completed IS 'True quando o utilizador concluiu o wizard inicial do escritório.';
