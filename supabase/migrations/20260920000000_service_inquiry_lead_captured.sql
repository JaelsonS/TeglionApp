-- Lead parcial no formulário público (etapa 1)
ALTER TABLE public.service_inquiries
  DROP CONSTRAINT IF EXISTS service_inquiries_status_check;

ALTER TABLE public.service_inquiries
  ADD CONSTRAINT service_inquiries_status_check
  CHECK (
    status IN (
      'LEAD_CAPTURED',
      'NEW',
      'CONTACTED',
      'DOCS_REQUESTED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    )
  );

-- ROLLBACK
-- ALTER TABLE public.service_inquiries DROP CONSTRAINT IF EXISTS service_inquiries_status_check;
-- ALTER TABLE public.service_inquiries ADD CONSTRAINT service_inquiries_status_check
--   CHECK (status IN ('NEW', 'CONTACTED', 'DOCS_REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
