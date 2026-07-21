-- Teglion — Stripe billing por escritório
ALTER TABLE public.firms
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS firms_stripe_customer_id_key
  ON public.firms (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
