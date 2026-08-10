-- Fase 1a — hardening do access_token do mini-portal (ver especificação da sessão, v8).
--
-- O token do mini-portal (/pedidos/:token) nunca expirava nem podia ser
-- revogado. Esta migration acrescenta um ciclo de vida: um tecto generoso
-- desde a submissão (a aplicar 180 dias em código), apertado para uma janela
-- curta quando a ServiceInquiry fica concluída/cancelada (30 dias em código),
-- e uma via de revogação manual pela equipa (suspeita de link vazado).
--
-- Aditivo, nullable, zero-downtime. Nenhuma linha existente é afectada.

ALTER TABLE public.service_inquiries
  ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS access_token_revoked_at TIMESTAMPTZ;

-- ============================================================
-- Down-migration (não executado automaticamente — rollback manual):
--
-- ALTER TABLE public.service_inquiries
--   DROP COLUMN IF EXISTS access_token_expires_at,
--   DROP COLUMN IF EXISTS access_token_revoked_at;
-- ============================================================
