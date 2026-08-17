-- Grupo de apresentação na Página Pública (texto livre, por serviço).
-- Não é hierarquia pai/filho — só organização visual.
ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS public_group TEXT;

COMMENT ON COLUMN public.accounting_services.public_group IS
  'Nome do grupo na Página Pública (ex.: Consultoria Fiscal). NULL = aparece sem grupo.';
