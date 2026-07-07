# TegLion - Checklist de Go-Live (automatizado)

## Objetivo

Declarar GO apenas quando segurança, isolamento tenant, smoke operacional e regressão frontend estiverem aprovados.

## Comando único

```bash
npm run release:readiness
```

## O que este checklist valida automaticamente

1. Frontend unit tests
2. Frontend build SPA de produção
3. Frontend E2E smoke
4. Backend auditoria estática de segurança
5. Backend gate estrito de release

## Gate estrito backend

O gate backend inclui:

1. Isolamento tenant com modo estrito (sem warnings e sem skip HTTP)
2. Smoke de infraestrutura piloto
3. Drill de incidente validando:
   - health endpoints
   - correlação request-id
   - contrato de erro 401/404

## Pré-requisitos de ambiente

1. `SUPABASE_URL`
2. `SUPABASE_SERVICE_ROLE_KEY`
3. `JWT_ACCESS_SECRET`
4. `JWT_REFRESH_SECRET`
5. `DATA_ENCRYPTION_KEY`
6. `FRONTEND_URL`
7. `CORS_ORIGINS`

## Regra de release

Não fazer deploy se `npm run release:readiness` falhar.

## Gate funcional de equipa (obrigatório)

Validar manualmente em staging antes de produção:

1. Criar membro por acesso direto (`POST /contabil/team`) e confirmar login imediato.
2. Criar convite de equipa (`POST /contabil/team/invites`) e confirmar:
   - preview público (`GET /public/team-invite/:token`)
   - aceitação (`POST /public/team-invite/:token/accept`)
   - bloqueio de login antes da confirmação de e-mail (`EMAIL_NOT_CONFIRMED`)
   - confirmação de e-mail (`GET /public/team-email-confirm/:token`) e login após confirmação.
3. Reenviar e revogar convite (`POST /contabil/team/:id/resend-invite`, `POST /contabil/team/:id/revoke-invite`).
4. Atualizar permissões por membro (`PATCH /contabil/team/:id/permissions`) e validar autorização efetiva na API.
5. Confirmar trilho de auditoria para ações de equipa/convites/permissões.

## Rollback

1. Reverter para o último commit verde em produção
2. Validar `npm run release:readiness` no commit de rollback
3. Reabrir release apenas após correção da causa raiz
