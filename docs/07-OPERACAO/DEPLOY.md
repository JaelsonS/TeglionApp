# Deploy

Visão geral do processo de publicação. Para os passos detalhados, use [../operations/DEPLOY_PRODUCTION.md](../operations/DEPLOY_PRODUCTION.md) e [../operations/DEPLOY_STAGING.md](../operations/DEPLOY_STAGING.md).

**Fluxo Git obrigatório:** [../operations/GIT_WORKFLOW.md](../operations/GIT_WORKFLOW.md) — `main` = produção; trabalho só via `feature/*` → staging → PR → CI → `main`.

## Onde cada parte roda

Frontend na Vercel, backend no Render, banco e storage no Supabase. Cada um com seu próprio ciclo de deploy — não é um "deploy único" que sobe tudo junto.

| Ambiente | Git | Destino |
|----------|-----|---------|
| Produção | `main` | Vercel Production + Backend Prod + Supabase PROD |
| Staging | `staging` (integração) ← PRs de `feature/fase-N` | Preview/Staging + Backend Staging + Supabase STAGING |

## O que é automático

Todo PR (e push) para `main` / `staging` corre a esteira CI: typecheck e testes frontend, build, suíte backend, auditoria estática, tenant isolation contra **staging**, limites de ficheiro e secret scan. O job `validate` é **obrigatório** para merge na `main` (repository ruleset).

## Protecção de produção

A `main` não aceita push directo nem force push. Alterações entram só por Pull Request com CI verde. Desenvolvimento e UAT acontecem em staging com dados fictícios — nunca na base da Liliane.

## Rollback

Frontend: reverter para o deploy anterior na Vercel é uma operação de poucos cliques. Backend: redeploy do último commit saudável no Render. Migração de banco não tem processo de rollback automatizado documentado — reforça a importância do item de backup/restore testado, coberto em [DISASTER-RECOVERY.md](../06-SEGURANCA/DISASTER-RECOVERY.md).
