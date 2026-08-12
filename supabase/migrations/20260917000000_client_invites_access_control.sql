-- Ciclo de vida completo do convite/acesso do cliente: permite revogar o
-- acesso ao portal e reemitir um novo convite sem apagar o cliente nem
-- qualquer dado associado (documentos, mensagens, agendamentos, obrigações).
-- 100% aditivo — nenhuma coluna existente é alterada ou removida.

ALTER TABLE public.client_invites
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS portal_access_status TEXT NOT NULL DEFAULT 'NO_ACCESS'
    CHECK (portal_access_status IN ('NO_ACCESS', 'PENDING_INVITE', 'ACTIVE', 'REVOKED'));

-- Backfill: deriva o estado a partir dos dados já existentes (quem já tem
-- password_hash fica ACTIVE; quem tem convite pendente fica PENDING_INVITE;
-- os restantes ficam NO_ACCESS, que já é o default da coluna).
UPDATE public.clients c
SET portal_access_status = CASE
  WHEN c.password_hash IS NOT NULL THEN 'ACTIVE'
  WHEN EXISTS (
    SELECT 1 FROM public.client_invites ci
    WHERE ci.client_id = c.id AND ci.status = 'PENDING'
  ) THEN 'PENDING_INVITE'
  ELSE 'NO_ACCESS'
END
WHERE c.portal_access_status = 'NO_ACCESS';

CREATE INDEX IF NOT EXISTS idx_clients_portal_access_status ON public.clients(portal_access_status);
