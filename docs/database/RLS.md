# Row Level Security (RLS)

> Fontes consolidadas neste documento: `docs/04-ARQUITETURA/DATABASE.md` e `docs/07-OPERACAO/DATABASE-MIGRATIONS.md` (ambos 12/08/2026), e leitura direta de `supabase/rls.sql`, `supabase/policies.sql` e das políticas adicionadas em migrations (`20260927020000_sprint0_rls_defense_in_depth.sql`, `20260927030000_sprint0_architecture_debt_parity.sql`, `20260824200000_fix_rls_policies_idempotent.sql`, entre outras — auditoria de 18-19/08/2026). O desenho estrutural do isolamento multi-tenant como um todo (por que essa escolha existe, o que ela custa) está em `architecture/MULTI_TENANCY.md`; este documento cobre a implementação técnica em RLS/schema.

## O que existe

RLS está habilitado em toda tabela que carrega dado de escritório — `firms`, `firm_users`, `clients`, `obligations`, `client_tasks`, `documents`, `messages`, `consultations`, `accounting_services`, `audit_logs`, `client_invites`, `content_views`, `activity_events`, `sms_logs`, `news_articles`, `in_app_notifications` no bootstrap inicial (`supabase/rls.sql`), e mais tabelas adicionadas depois por migration (`conversations`, `document_requests`, `task_recurring_rules`, `task_month_exclusions`, `obligation_templates`, `obligation_recurrence_rules`, `task_comments`, `firm_notifications`, `task_automation_rules`, `push_subscriptions`, `stripe_webhook_events`, `auth_login_attempts`, entre outras).

## As funções helper

Três funções `SECURITY DEFINER`, `STABLE`, definidas em `supabase/rls.sql`, usadas por praticamente toda política do schema:

```sql
CREATE OR REPLACE FUNCTION public.current_firm_id()
RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() ->> 'firm_id', '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() ->> 'client_id', '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_firm_staff()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((auth.jwt() ->> 'role') IN ('FIRM_OWNER', 'FIRM_STAFF', 'FIRM_CONSULTANT'), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

(mais `is_client_user()`, equivalente para `role = 'CLIENT_USER'`.) `current_firm_id()` lê o claim `firm_id` de dentro do JWT (`auth.jwt()`), emitido pelo backend Node durante a sessão autenticada. É o valor que toda política usa para decidir se uma linha pertence ao tenant de quem está fazendo a consulta.

## O padrão das políticas

A imensa maioria das políticas segue a mesma forma — filtrar por `firm_id = public.current_firm_id()` combinado com o papel de quem acessa:

```sql
CREATE POLICY clients_firm_staff ON public.clients
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY clients_self_read ON public.clients
  FOR SELECT USING (
    public.is_client_user()
    AND id = public.current_client_id()
    AND firm_id = public.current_firm_id()
  );
```

Staff do escritório tem acesso amplo (`FOR ALL`) ao que pertence ao seu `firm_id`. Cliente final tem acesso restrito — normalmente só `SELECT` do que é dele, filtrando por `client_id` além de `firm_id`. Em algumas tabelas sensíveis sem `firm_id` (por exemplo `stripe_webhook_events`, `auth_login_attempts`), o padrão é deny-all para os papéis de API (`USING (false) WITH CHECK (false)`) — a leitura e escrita real dessas tabelas acontece só pelo backend, via `service_role`.

## A ressalva honesta: `service_role` ignora RLS

O backend Node se conecta ao Supabase com a `service_role` — a chave de privilégio total, que **ignora todas as políticas de RLS declaradas acima**. Isso não é um acidente: existe porque o backend precisa fazer operação administrativa em nome de qualquer escritório (por exemplo, um agendador que roda lembretes para todos os escritórios ativos ao mesmo tempo), e um modelo de acesso restrito a uma sessão de usuário único não encaixa direto nesse tipo de rotina em lote.

A consequência prática: **as políticas de RLS acima não protegem o tráfego real do produto hoje.** Elas existem, estão corretas, são mantidas atualizadas a cada migration nova — mas nada que o backend faz passa por uma sessão que as respeitaria. A fronteira real de isolamento entre escritórios é outra: é o filtro `firm_id` explícito, escrito à mão, em cada função de repositório do backend, derivado sempre da sessão autenticada de quem fez a requisição.

Isso significa que RLS hoje funciona como **defesa em profundidade preparatória**, não como a camada primária de proteção:

- Se algum caminho de acesso futuro passar a usar uma chave que respeita RLS (um token de usuário do Supabase Auth, por exemplo, em vez de sempre `service_role`), a proteção já está no lugar.
- Se uma política estiver ausente ou errada numa tabela nova, isso não abre brecha no tráfego real — porque o tráfego real não usa RLS —, mas seria um problema no dia em que essa mudança de acesso acontecesse.
- Não é uma rede de segurança que pegaria hoje uma consulta de backend que esquecesse o filtro de `firm_id` — só um `firm_id` errado ou ausente no código do repositório mesmo, revisado manualmente ou pego em teste de isolamento entre escritórios (ver `security/TEGLION_SECURITY_GATE.md`).

## Padrão em migrations novas

Migrations recentes que criam tabela nova consistentemente habilitam RLS e criam a política junto, no mesmo arquivo — mesmo sabendo que o tráfego real não passa por ela hoje (`20260927020000_sprint0_rls_defense_in_depth.sql` é explícito sobre isso no próprio comentário: "preparação; tráfego real continua em service_role"). Esse é o padrão a manter: toda tabela nova com `firm_id` ganha RLS habilitado e política `firm_id = current_firm_id()` no mesmo commit que a cria — mesmo que a proteção real, hoje, dependa do filtro no repositório.
