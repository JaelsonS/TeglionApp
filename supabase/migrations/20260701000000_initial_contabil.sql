-- ContaBil — migration bundle inicial
-- Aplicar manualmente no Supabase SQL Editor (ordem):
--   1. schema.sql
--   2. tables.sql
--   3. indexes.sql
--   4. rls.sql
--   5. policies.sql
--
-- Triggers updated_at (executar após tables.sql):
/*
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['firms','firm_users','clients','obligations','client_tasks','documents','consultations']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END $$;
*/
