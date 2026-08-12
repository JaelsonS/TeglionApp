-- Agendamento na página pública passa a ser opt-in por serviço.
-- Só serviços que o escritório marcar (ex.: consultorias) mostram horários.

ALTER TABLE public.accounting_services
  ALTER COLUMN requires_booking SET DEFAULT false;

-- Desliga agendamento público em serviços genéricos sem horários personalizados.
-- Mantém activo: quem já personalizou booking_overrides, e templates de
-- consultoria/simulação IRS do catálogo (ainda editáveis pelo escritório).
UPDATE public.accounting_services
SET requires_booking = false,
    updated_at = now()
WHERE requires_booking = true
  AND (
    booking_overrides IS NULL
    OR booking_overrides = '{}'::jsonb
  )
  AND COALESCE(catalog_key, '') NOT IN (
    'consultoria-individual',
    'simulacao-irs'
  );

-- Rollback (documentação):
-- ALTER TABLE public.accounting_services ALTER COLUMN requires_booking SET DEFAULT true;
