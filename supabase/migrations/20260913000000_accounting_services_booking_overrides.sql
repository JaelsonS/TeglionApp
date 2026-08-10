-- Fase 3b — agendamento configurável por Service (ver plan file da sessão, v8,
-- secção 4). Até aqui, todos os serviços do escritório partilhavam exactamente
-- a mesma janela de disponibilidade (firms.settings.booking) — não era
-- possível dizer "Consultoria só de manhã, IRS não aceita sábado". Aditiva,
-- sem afectar nenhum serviço existente: booking_overrides começa NULL em
-- todas as linhas, e NULL continua a significar "usa as regras gerais do
-- escritório" (mesmo comportamento de hoje, sem regressão).

ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS booking_overrides JSONB;

-- Rollback (não executável, documentação apenas):
-- ALTER TABLE public.accounting_services DROP COLUMN IF EXISTS booking_overrides;
