-- ContaBil Supabase — bootstrap
-- Ordem: schema.sql → tables.sql → indexes.sql → rls.sql → policies.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'ContaBil multi-tenant accounting SaaS';
