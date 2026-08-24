# Runbook operacional

> Substitui o antigo `docs/operations/README.md`, que tinha três links quebrados apontando para pastas removidas (`../CLIENTE_PILOTO/`, `../company/`, `../product/SCALE_100K...`). Não recriei esses links aqui.

Esse é o índice operacional do Teglion pra mim mesmo: o que faço pra preparar, lançar, monitorar e recuperar produção, e onde está cada guia de configuração de integração.

## Infraestrutura (onde tudo roda)

| Documento | Quando ler |
|-----------|------------|
| [`../infrastructure/INFRASTRUCTURE.md`](../infrastructure/INFRASTRUCTURE.md) | Visão geral: Render, Vercel, Supabase, Redis, R2 |
| [`../infrastructure/ENVIRONMENTS.md`](../infrastructure/ENVIRONMENTS.md) | Desenvolvimento local, staging, produção — configuração e diferenças |
| [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md) | Fluxo Git, deploy staging, deploy produção, rollback |
| [`../infrastructure/CI_CD.md`](../infrastructure/CI_CD.md) | O que roda sozinho no CI hoje vs. o que ainda é manual |
| [`../infrastructure/OBSERVABILITY.md`](../infrastructure/OBSERVABILITY.md) | Sentry, e o que ainda não existe em monitoramento |

## Operação

| Documento | Quando ler |
|-----------|------------|
| [`INCIDENTS.md`](./INCIDENTS.md) | Algo quebrou — severidade, resposta, incidentes já registrados |
| [`RELEASES.md`](./RELEASES.md) | Decidir e declarar uma release pronta para produção |

## Guias de configuração por integração

| Documento | Cobre |
|-----------|-------|
| [`setup/GOOGLE_SSO.md`](./setup/GOOGLE_SSO.md) | Login com Google (custom, não é Supabase Auth) |
| [`setup/GOOGLE_CALENDAR.md`](./setup/GOOGLE_CALENDAR.md) | Sincronização de agenda com Google Calendar |
| [`setup/GOOGLE_DRIVE.md`](./setup/GOOGLE_DRIVE.md) | Picker do Google Drive para anexar arquivo em conversa |
| [`setup/STRIPE.md`](./setup/STRIPE.md) | Billing SaaS — escritório paga o Teglion |
| [`setup/STRIPE_CONNECT.md`](./setup/STRIPE_CONNECT.md) | Pagamentos — cliente paga o escritório (dinheiro real) |
| [`setup/REDIS.md`](./setup/REDIS.md) | Rate limit, lockout e filas em produção |
| [`setup/BREVO_DOMAIN.md`](./setup/BREVO_DOMAIN.md) | Domínio autenticado para email transacional |
| [`setup/FREE_PLAN.md`](./setup/FREE_PLAN.md) | O que dá para fechar de isolamento staging/produção sem contratar infraestrutura nova |

## Regras de operação que sigo

1. Nada é promovido para produção sem o gate de CI verde (`validate`) — ver [`../infrastructure/CI_CD.md`](../infrastructure/CI_CD.md).
2. Segredo nunca edito ou leio do Git — só no provedor (Render, Vercel, GitHub Environment).
3. Backend e frontend de uma mesma release eu deployo sempre juntos — a autenticação é cookie-only e depende dos dois estarem em sincronia.
4. Deixo o rollback pronto antes de abrir tráfego para uma release nova — ver [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md#rollback).
