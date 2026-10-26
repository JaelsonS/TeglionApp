-- Avença: início e fim (AAAA-MM) para gerar só dentro do intervalo.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS retainer_start_month TEXT
    CHECK (retainer_start_month IS NULL OR retainer_start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  ADD COLUMN IF NOT EXISTS retainer_end_month TEXT
    CHECK (retainer_end_month IS NULL OR retainer_end_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

COMMENT ON COLUMN public.clients.retainer_start_month IS
  'Primeiro mês da avença (AAAA-MM). NULL = sem limite inferior.';
COMMENT ON COLUMN public.clients.retainer_end_month IS
  'Último mês da avença (AAAA-MM). NULL = sem limite superior.';
