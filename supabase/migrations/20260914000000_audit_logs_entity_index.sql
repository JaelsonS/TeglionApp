-- Fase 4 — histórico/timeline visível na solicitação (ver plan file da sessão,
-- v7/v8: "recomendo também gravar em activityService... reaproveitando a infra
-- já existente"). Decisão: reaproveitar audit_logs directamente por leitura —
-- todos os eventos de service_inquiry já são gravados lá desde a Fase 1a/2a/2b/2c
-- (created, submitted, status_changed, token_revoked, request_added,
-- document_delivered, request_answered), não é preciso escrever em duas tabelas.
-- Esta migration só acrescenta o índice que a nova leitura por entidade precisa
-- (firm_id + entity_type + entity_id, já filtrados por essa combinação em todo
-- pedido do ecrã de Solicitações) — sem esse índice, cada abertura do painel de
-- detalhe faria um scan sequencial de audit_logs, tabela que já é escrita em
-- quase toda ação do sistema.

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs (firm_id, entity_type, entity_id, created_at DESC);

-- Rollback (não executável, documentação apenas):
-- DROP INDEX IF EXISTS idx_audit_logs_entity;
