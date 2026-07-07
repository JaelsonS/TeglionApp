-- Sprint 0.9.1 — cargo/função de membro de equipa

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS job_title TEXT;

CREATE INDEX IF NOT EXISTS idx_firm_users_firm_job_title
  ON public.firm_users (firm_id, job_title);
