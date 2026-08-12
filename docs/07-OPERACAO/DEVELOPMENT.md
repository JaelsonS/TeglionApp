# Desenvolvimento

Visão geral. Para o passo a passo de configurar o ambiente localmente, use [../operations/DEV_LOCAL.md](../operations/DEV_LOCAL.md) — este documento não duplica aquele, só dá o contexto de como o projeto está organizado.

## Estrutura do monorepo

Dois workspaces principais — `frontend` e `backend` — mais `supabase/` (migrations) e `tools/ci/` (scripts de verificação usados no pipeline). Comandos na raiz do repositório operam nos dois workspaces via npm workspaces (`npm run build`, `npm run test`, etc.), delegando para o script correspondente de cada pacote.

## Comandos principais

- `npm run dev:frontend` / `npm run dev:backend` — subir cada lado localmente.
- `npm run build` — build de produção do frontend.
- `npm run tsc` — checagem de tipos do frontend.
- `npm run test` — testes do frontend (Vitest).
- `npm run test:backend` — hoje roda só um arquivo de teste do backend, não a suíte completa (ver [SECURITY-GATES.md](../06-SEGURANCA/SECURITY-GATES.md) para o porquê isso é um risco, e como rodar a suíte completa localmente com `npm test` dentro de `backend/`).
- `npm run security:secrets` — varredura de segredo antes de commit.
- `npm run release:readiness` — script de checklist antes de promover para produção.

## Convenção de módulo

Todo módulo novo de backend segue o padrão `routes → middlewares → controller → service → repository`, com o repository sendo a única camada que fala com o Supabase (ver [BACKEND.md](../04-ARQUITETURA/BACKEND.md)). Toda função de repository que toca dado de escritório recebe `firm_id` explícito, derivado da sessão autenticada — nunca de um parâmetro de entrada não validado. Esse padrão não é opcional: é a única coisa que mantém o isolamento entre escritórios funcionando (ver [MULTI-TENANCY.md](../04-ARQUITETURA/MULTI-TENANCY.md)).

## Antes de abrir um PR que toca backend

Rodar a suíte completa de teste do backend localmente (`cd backend && npm test`), não só o comando abreviado da raiz — e, se a mudança tocar em consulta de dado tenant-scoped, rodar também o teste de isolamento (`backend/scripts/tenant-isolation-test.js`) contra um ambiente que não seja produção. Nenhum dos dois é obrigatório automaticamente hoje (ver [SECURITY-GATES.md](../06-SEGURANCA/SECURITY-GATES.md)), então é responsabilidade de quem abre o PR rodar manualmente até isso mudar.
