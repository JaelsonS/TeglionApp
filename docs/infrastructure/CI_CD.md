# CI/CD

> Fontes consolidadas: `docs/07-OPERACAO/DEVELOPMENT.md`, `docs/operations/GIT_WORKFLOW.md`, `docs/operations/GO_LIVE_CHECKLIST.md` (pasta antiga, removida após esta consolidação), mais verificação direta em `.github/workflows/ci.yml`, `package.json` e `tools/ci/` (fonte de verdade, não documentação — usei pra confirmar o que este arquivo afirma).

## O que roda automaticamente hoje

Montei um único workflow, `.github/workflows/ci.yml`, job `validate`, disparado em todo push e Pull Request pra `main` e `staging`. Passos, na ordem real do arquivo:

1. **Typecheck do frontend** — `npm run tsc`.
2. **Testes unitários do frontend** — `npm test`.
3. **Build do frontend** — `npm run build`.
4. **Suíte completa de testes do backend** — `npm run test:backend`, que roda `node --test 'src/**/*.test.js'` dentro de `backend/`. Isso **é a suíte inteira**, não um arquivo isolado — o job injeta placeholders locais (`JWT_ACCESS_SECRET`, `SUPABASE_URL`, `DATA_ENCRYPTION_KEY` etc., todos fictícios, nunca segredo real) porque o carregamento de `env.js` exige essas variáveis pra importar os módulos; os testes mockam I/O e não falam com Supabase/Stripe de verdade.
5. **Auditoria estática de segurança do backend** — `npm run test:security-static -w backend`, procura padrões de risco conhecidos no código.
6. **Teste de isolamento entre escritórios contra staging** — `npm run test:tenant-isolation -w backend`, rodado com as credenciais do projeto Supabase de **staging** (`STAGING_SUPABASE_URL` / `STAGING_SUPABASE_SERVICE_ROLE_KEY`, secrets do GitHub Environment). Confirmei no próprio workflow: se qualquer um desses dois secrets estiver ausente, o step falha explicitamente (`exit 1`) antes mesmo de tentar rodar o teste — não deixo passar em silêncio, não pulo a verificação. O script também falha cedo se a chave usada não tiver `role=service_role` (evito o erro clássico de colar a chave `anon` por engano).
7. **Limite de tamanho de arquivo** — `npm run check:file-sizes`.
8. **Varredura de segredo** — `npm run security:secrets`, evita que uma chave real seja commitada por engano.

O job `validate` é obrigatório pra merge na `main` — é um status check exigido pela branch protection/ruleset do GitHub (`strict`, branch precisa estar atualizada), com `enforce_admins: true` e force push/delete desligados nessa branch.

Isso corrige uma limitação real que existia antes: a suíte de teste do backend rodava só um arquivo no CI, e o teste de isolamento entre escritórios não rodava sozinho — fechei os dois gaps durante o Sprint 0 (itens 4 e 7, registro preservado em `docs/historico/SPRINT-0.md`). Se eu encontrar algum documento mais antigo que ainda descreva "só um arquivo de teste roda no CI" ou "isolamento não roda automaticamente", está desatualizado.

## O que ainda é manual

**`npm run release:readiness`** (`tools/ci/release-readiness.mjs`) não é chamado pelo `ci.yml` — é um script local, que disparo manualmente antes de promover pra produção. Ele roda, em sequência: testes unitários do frontend, build SPA de produção, suíte E2E do frontend (Playwright, `npm run test:e2e`), auditoria estática de segurança do backend, e o gate estrito de release do backend (`backend/scripts/release-gate.js`) — que inclui isolamento tenant em modo estrito (sem warnings, sem skip HTTP), smoke de infraestrutura do piloto, e o drill de incidente (health endpoints, correlação de `request-id`, contrato de erro 401/404). Ver [`../operations/RELEASES.md`](../operations/RELEASES.md) pra quando e como esse gate entra na minha decisão de release.

**Suíte E2E do frontend (Playwright)** roda dentro do `release:readiness`, não no `ci.yml` a cada push — ou seja, roda sob demanda, não em todo PR.

**Smoke test do piloto** (`npm run smoke:pilot`) — rodo manualmente contra local, staging ou produção, não faz parte do workflow do GitHub Actions.

**Drill de restauração de backup** — não é código que roda no CI; é um procedimento operacional que executo manualmente e registro em `docs/database/` (migrado de `docs/operations/BACKUP_RESTORE.md`), com cadência recomendada trimestral.

**Drill de rollback de migração** — diferente do drill de restore de backup, esse eu ainda não registrei como exercício formal; permanece pendente (ver [`DEPLOYMENT.md`](./DEPLOYMENT.md#rollback)).

## Convenção de módulo (relevante pro que o CI audita)

Todo módulo novo de backend segue o padrão `routes → middlewares → controller → service → repository`, com o repository sendo a única camada que fala com o Supabase (ver `docs/architecture/`). Toda função de repository que toca dado de escritório recebe `firm_id` explícito, derivado da sessão autenticada — nunca de um parâmetro de entrada não validado. É esse padrão, não o RLS sozinho, que o teste de isolamento entre escritórios do CI está de fato verificando.

## Antes de abrir um PR que toca backend

Como o `validate` já roda a suíte completa de backend e o teste de isolamento automaticamente em todo push, rodar os dois manualmente antes de abrir o PR é opcional pra mim, mas continua sendo a forma mais rápida de pegar um problema sem esperar o CI:

```bash
cd backend && npm test                                    # suíte completa, local
node backend/scripts/tenant-isolation-test.js              # contra um ambiente que não seja produção
```
