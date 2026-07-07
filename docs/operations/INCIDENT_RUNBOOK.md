# TegLion - Incident Runbook

## Escopo

Runbook para incidentes de disponibilidade, autenticação e isolamento tenant.

## Severidades

1. P0: vazamento cross-tenant, auth bypass, indisponibilidade total
2. P1: degradação severa de login/upload/mensagens/faturamento
3. P2: falha parcial com workaround

## Resposta inicial

1. Confirmar sintoma com endpoint de health
2. Coletar request-id de erro reportado pelo cliente
3. Correlacionar logs por request-id
4. Classificar severidade
5. Acionar owner técnico e comunicação

## Drill automatizado

Executar:

```bash
cd backend && API_BASE=http://127.0.0.1:8001 npm run runbook:drill
```

Valida automaticamente:

1. `/health` e `/api/public/health`
2. Presença de `x-request-id`
3. Erro 401 com `requestId` no payload
4. Erro 404 com código `ROUTE_NOT_FOUND`

## Ações por tipo de incidente

### Auth indisponível

1. Verificar `/api/public/health`
2. Verificar secrets JWT e cookies
3. Validar CORS e CSRF
4. Se persistir, rollback para último release verde

### Falha no onboarding de equipa (convite/e-mail)

1. Validar estado do membro em `firm_users` (`invite_status`, `email_confirmed_at`, `is_active`).
2. Validar convite em `firm_member_invites` (`status`, `expires_at`) e expiração de token.
3. Validar token de confirmação em `email_confirmation_tokens` (`used_at`, `expires_at`).
4. Reemitir convite com endpoint de reenvio se token estiver revogado/expirado.
5. Confirmar que login retorna `EMAIL_NOT_CONFIRMED` quando aplicável e libera após confirmação.

### Suspeita de vazamento tenant

1. Bloquear novas releases
2. Executar tenant isolation estrito
3. Isolar endpoint suspeito
4. Corrigir e redeploy apenas com gate verde

### Falha de API em produção

1. Confirmar health e logs com request-id
2. Executar smoke de backend
3. Aplicar rollback se P0/P1 sem mitigação rápida

## Critério de encerramento

1. Causa raiz documentada
2. Evidência de correção com gate de release verde
3. Comunicação concluída para stakeholders
