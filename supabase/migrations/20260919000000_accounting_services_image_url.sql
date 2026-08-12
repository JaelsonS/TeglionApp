-- Banner/imagem opcional por serviço (página pública)
ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ROLLBACK
-- ALTER TABLE public.accounting_services DROP COLUMN IF EXISTS image_url;
