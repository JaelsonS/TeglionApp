# Releases

> Fontes consolidadas: partes de `docs/07-OPERACAO/DEPLOY.md`, `docs/operations/GO_LIVE_CHECKLIST.md` e `docs/operations/GO_PRODUCTION.md` especificamente sobre o processo de decidir e executar uma release — não sobre a mecânica de deploy em si, que está em [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md) (pasta antiga, removida após esta consolidação).

Esse documento cobre a pergunta que eu mesmo faço antes de cada release: "estou pronto pra promover isso pra produção?" — não "como o deploy tecnicamente acontece" (isso é [`DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md)) nem "o que roda automaticamente no CI a cada push" (isso é [`CI_CD.md`](../infrastructure/CI_CD.md)).

## Gate automatizado — comando único

```bash
npm run release:readiness
```

Regra simples que sigo: **não faço deploy se esse comando falhar.** Ele valida, em sequência:

1. Testes unitários do frontend.
2. Build SPA de produção do frontend.
3. Suíte E2E do frontend (Playwright).
4. Auditoria estática de segurança do backend.
5. Gate estrito de release do backend, que por sua vez cobre:
   - Isolamento tenant em modo estrito (sem warnings, sem skip HTTP).
   - Smoke de infraestrutura do piloto.
   - Drill de incidente — health endpoints, correlação de `request-id`, contrato de erro 401/404 (mesmo drill descrito em [`INCIDENTS.md`](./INCIDENTS.md)).

Pré-requisitos de ambiente pra esse gate rodar: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATA_ENCRYPTION_KEY`, `FRONTEND_URL`, `CORS_ORIGINS`.

Esse comando é diferente do que já roda sozinho no CI a cada push (ver [`CI_CD.md`](../infrastructure/CI_CD.md)) — é um gate adicional, mais pesado, que disparo manualmente antes de promover uma release pra produção.

## Gate funcional de equipe (validação manual em staging, obrigatória)

Antes de promover pra produção, valido manualmente em staging:

1. Crio membro por acesso direto (`POST /contabil/team`) e confirmo login imediato.
2. Crio convite de equipe (`POST /contabil/team/invites`) e confirmo: preview público (`GET /public/team-invite/:token`), aceitação (`POST /public/team-invite/:token/accept`), bloqueio de login antes da confirmação de email (`EMAIL_NOT_CONFIRMED`), confirmação de email (`GET /public/team-email-confirm/:token`) e login liberado depois.
3. Reenvio e revogação de convite (`POST /contabil/team/:id/resend-invite`, `POST /contabil/team/:id/revoke-invite`).
4. Atualizo permissões por membro (`PATCH /contabil/team/:id/permissions`) e valido que a autorização efetiva na API reflete a mudança.
5. Confirmo trilha de auditoria para ações de equipe, convites e permissões.

## Checklist pré-GO

Antes de abrir tráfego para uma release em produção, confiro:

- [ ] `npm run release:readiness` passou sem falha.
- [ ] `npm run tsc`, `npm run build` e `npm test` passaram no último commit.
- [ ] `npm run security:secrets` não encontrou credencial exposta.
- [ ] Variáveis de produção estão só no provedor (Render/Vercel), nunca no Git.
- [ ] Stripe está em modo live com os preços oficiais corretos.
- [ ] `SENTRY_DSN` (backend) e `VITE_SENTRY_DSN` (frontend) estão configuradas no ambiente de produção — ver [`../infrastructure/OBSERVABILITY.md`](../infrastructure/OBSERVABILITY.md) pra entender por que isso não é automático.
- [ ] Telas críticas estão alinhadas com as regras de role/permissão (RBAC via `requirePermission`/`requireRole`).

## Execução

1. Deploy do backend (Render) — verifico `/health` e `/api/public/health`.
2. Deploy do frontend (Vercel) — verifico rotas públicas e privadas.
3. Rodo o smoke do piloto contra o ambiente alvo (`npm run smoke:pilot`).
4. Monitoro logs de erro (Sentry, se configurado, e logs do provedor) pelos primeiros 30 minutos.

## Gate funcional pós-deploy (fluxo piloto completo)

O passo a passo está em [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md#fluxo-funcional-pós-deploy-smoke-manual-do-piloto) — não vou duplicar aqui.

Se a release envolver Stripe Connect ao vivo, adiciono: `STRIPE_CONNECT_ENABLED=true` confirmado, webhook de Connected accounts recebendo eventos, onboarding Express do escritório concluído, e um pagamento real de serviço processado de ponta a ponta (ver [`setup/STRIPE_CONNECT.md`](./setup/STRIPE_CONNECT.md)).

## Definição de GO

Considero uma release aprovada (GO) quando:

- Todos os checks técnicos automatizados passaram (CI + `release:readiness`).
- O fluxo crítico do piloto foi executado sem falha em staging.
- Não existe erro crítico novo introduzido em produção depois do deploy.
- O plano de rollback está pronto e validado antes de abrir tráfego — ver [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md#rollback).

Se qualquer um desses pontos falhar depois do deploy: rollback, comunicação do incidente e causa raiz em [`INCIDENTS.md`](./INCIDENTS.md), e só reabro a release depois da causa raiz corrigida.
