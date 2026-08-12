-- Meio de pagamento por serviço (UI pronta; Stripe Connect depois).
-- bank_transfer = transferência (já usado nos orçamentos)
-- multibanco / stripe_connect = reservados (front mostra "em breve")

ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'bank_transfer'
    CHECK (payment_method IN ('bank_transfer', 'multibanco', 'stripe_connect'));

COMMENT ON COLUMN public.accounting_services.payment_method IS
  'Como o cliente pode pagar este serviço. Stripe Connect / Multibanco activam-se depois da infra.';

-- Rollback:
-- ALTER TABLE public.accounting_services DROP COLUMN IF EXISTS payment_method;
