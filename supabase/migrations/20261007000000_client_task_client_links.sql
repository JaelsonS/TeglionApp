-- Relação muitos-para-muitos entre tarefas manuais e clientes (ROADMAP Fase 1 — tarefas
-- com vários clientes). Segue o mesmo padrão já usado em firm_entity_tag_links (*_tag_links):
-- PK composta, firm_id redundante para RLS, policy <tabela>_firm_staff.
--
-- client_tasks.client_id permanece como coluna legada, sincronizada em melhor esforço
-- (aponta para o primeiro cliente do vínculo, ou NULL). Esta tabela passa a ser a fonte
-- de verdade para "quais clientes esta tarefa tem" — ver ADR-0008 para a estratégia de
-- depreciação da coluna legada.

CREATE TABLE IF NOT EXISTS public.client_task_client_links (
  client_task_id UUID NOT NULL REFERENCES public.client_tasks(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_task_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_task_client_links_firm ON public.client_task_client_links (firm_id);
CREATE INDEX IF NOT EXISTS idx_client_task_client_links_client ON public.client_task_client_links (client_id);

ALTER TABLE public.client_task_client_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_task_client_links_firm_staff ON public.client_task_client_links;
CREATE POLICY client_task_client_links_firm_staff ON public.client_task_client_links
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Backfill: toda tarefa existente com client_id preenchido ganha o vínculo M2M correspondente.
-- Idempotente (ON CONFLICT DO NOTHING) -- seguro re-rodar esta migration.
INSERT INTO public.client_task_client_links (client_task_id, client_id, firm_id)
SELECT id, client_id, firm_id
FROM public.client_tasks
WHERE client_id IS NOT NULL
ON CONFLICT (client_task_id, client_id) DO NOTHING;

-- Rollback (documentação):
-- DROP TABLE IF EXISTS public.client_task_client_links;
