# Operações

Este é o meu centro de comando operacional do Teglion.
Eu mantenho aqui o que preciso para preparar, lançar, monitorizar e recuperar produção sem improviso.

| Documento | Quando ler |
|-----------|------------|
| [STATUS.md](./STATUS.md) | Estado actual do piloto e o que eu faço a seguir |
| [../CLIENTE_PILOTO/ROADMAP.md](../CLIENTE_PILOTO/ROADMAP.md) | Roadmap do piloto (vivo) |
| [../company/EVOLUTION_PLAN.md](../company/EVOLUTION_PLAN.md) | Bússola diária |
| [DEV_LOCAL.md](./DEV_LOCAL.md) | Primeiro setup em máquina local |
| [../product/SCALE_100K_1M_CHECKLIST.md](../product/SCALE_100K_1M_CHECKLIST.md) | Plano executivo de evolução para 100k → 1M utilizadores |
| [BRANCHING.md](./BRANCHING.md) | `main` (prod) vs `staging` (QA) |
| [FREE_PLAN_SETUP.md](./FREE_PLAN_SETUP.md) | Fechar guard rails de `staging`/`main` no plano free |
| [DEPLOY_STAGING.md](./DEPLOY_STAGING.md) | Ambiente de QA isolado |
| [DEPLOY_PRODUCTION.md](./DEPLOY_PRODUCTION.md) | Deploy produção |
| [GO_PRODUCTION.md](./GO_PRODUCTION.md) | Checklist final de GO e rollback |
| [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) | Gate automatizado antes de qualquer release |
| [REDIS_RENDER_SETUP.md](./REDIS_RENDER_SETUP.md) | Como eu deixo Redis activo no Render com segurança |
| [EXECUCAO_ROLES_TELAS.md](./EXECUCAO_ROLES_TELAS.md) | Plano de execução para evoluir funcionalidades e telas por role |
| [GOOGLE_SSO_SETUP.md](./GOOGLE_SSO_SETUP.md) | Login Google (não é Supabase Auth) |
| [BREVO_DOMAIN_SETUP.md](./BREVO_DOMAIN_SETUP.md) | Domínio autenticado para e-mails (Primary inbox) |
| [STORAGE.md](./STORAGE.md) | Ficheiros no Supabase Storage |
| [STRIPE_SETUP.md](./STRIPE_SETUP.md) | Configurar pagamentos |

## Regra de operação que eu sigo

1. Eu não promovo nada para produção sem gate verde.
2. Eu não mexo em secrets no Git; só no provider.
3. Eu deployo backend e frontend como release coordenado.
4. Eu sempre mantenho rollback pronto antes de abrir tráfego.
