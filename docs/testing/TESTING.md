# Testes

Este documento descreve a estratégia de testes real do Teglion — o que existe hoje, com evidência de código, não o que seria desejável ter. Levantado em 19/08/2026 lendo diretamente os scripts, os `package.json` e o workflow de CI, não copiado de documentação anterior.

## Resumo do estado

| Camada | Existe de verdade? | Roda em CI? |
|---|---|---|
| Testes unitários backend (`node:test`) | Sim — 63 arquivos | Sim |
| Testes unitários frontend (Vitest) | Sim — 33 arquivos | Sim |
| Teste de isolamento entre tenants | Sim — script dedicado, grava dados reais em Supabase de staging | Sim, camada de serviço/repositório. A camada HTTP do mesmo script **não** roda em CI hoje (ver abaixo) |
| Auditoria de segurança estática | Sim — checklist fixo de ~12 verificações | Sim |
| Testes E2E (Playwright) | Sim — 1 arquivo, 3 testes, superfície pública | **Não** — não está no workflow de CI |
| Lint (ESLint) | Instalado como dependência, sem config e sem script | Não existe |
| Cobertura de testes (%) | Não existe ferramenta configurada | — |

## Testes unitários — backend

Runner: `node:test`, o test runner nativo do Node — não há Jest, Mocha nem Vitest no backend. Mocking usa o `mock` embutido do próprio `node:test` (ver `backend/src/modules/booking/booking.service.test.js`, que usa `mock.method` para substituir chamadas de repositório).

- 63 arquivos `*.test.js`, todos colocados ao lado do código que testam (não existe pasta `__tests__` separada). Exemplos reais:
  - `backend/src/modules/booking/booking.service.test.js`
  - `backend/src/modules/entitlements/entitlements.service.test.js`
  - `backend/src/db/supabase/repositories/comments-firm-id.test.js`
  - `backend/src/utils/crypto-fields.test.js`
  - `backend/src/middlewares/turnstile.middleware.test.js`
  - `backend/src/config/country-config.registry.test.js`
- A maior concentração está em `src/modules/firm/` (equipe, convites, serviços, tags, step-up, catálogo CAE) e nas integrações Google Calendar/Drive.
- Alguns testes são guarda-corrimões pontuais e explícitos, não suítes de comportamento completas — por exemplo, `comments-firm-id.test.js` só confirma que `listComments` rejeita quando chamado sem `firmId`, provavelmente escrito depois de um incidente ou revisão específica (o nome do teste, `SEC-M3`, sugere isso).
- Script real executado: `test` no `backend/package.json` roda `NODE_ENV=test node --test 'src/**/*.test.js'` — ou seja, os 63 arquivos, via glob.
- **Nome enganoso a registrar**: existe também um script `test:unit`, que roda **um único arquivo** (`src/utils/file-magic-bytes.test.js`). Não é a suíte unitária completa — parece um resquício de quando havia menos testes. O CI não usa `test:unit`; usa `test:backend` (raiz do monorepo), que mapeia para o `test` completo do backend.

## Testes unitários — frontend

Runner: Vitest, com `happy-dom` como ambiente DOM e Testing Library (`@testing-library/react`, `@testing-library/user-event`).

- 33 arquivos `*.test.ts`/`*.test.tsx`, também colocados ao lado do código (mesmo padrão do backend), concentrados em `src/features/firm/`, `src/features/client/` e `src/features/public-intake/`.
- A maioria testa funções auxiliares puras — parsing, formatação, cálculo de datas, regras de navegação, regras de publicação de serviço — não renderização de componente. Só 3 dos 33 arquivos efetivamente montam um componente React: `AgendaServiceHoursPanel.test.tsx`, `ServiceBookingAvailabilitySection.test.tsx` e `TeglionPublicCredit.test.tsx`. O resto é lógica isolada de UI, testada sem DOM.
- Script real: `test` roda `vitest run`, e é o que o CI executa (`npm test`, que na raiz do monorepo aponta para o workspace `frontend`).
- Não confundir com o número "28/28 PASS" citado no registro histórico da Fase 1B (`docs/historico/PHASE-1B.md`) — aquilo era a contagem de testes (não de arquivos) num momento específico de meados de agosto de 2026; o conjunto de arquivos cresceu desde então e este documento não tenta reconciliar os dois números.

## Teste de isolamento entre tenants (`backend/scripts/tenant-isolation-test.js`)

Este é o teste mais importante do produto, dado que o Teglion é multi-tenant e o isolamento entre escritórios é o requisito de segurança que define se o produto é vendável. Vale descrever com precisão o que ele realmente faz.

**O que não é**: não é parte da suíte `node --test`. É um script standalone, executado via `npm run test:tenant-isolation` (ou dentro de `test:security`, que o encadeia depois da auditoria estática).

**Como roda**: precisa de credenciais reais de Supabase (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). Em CI, essas credenciais apontam para um projeto Supabase de **staging** (`STAGING_SUPABASE_URL` / `STAGING_SUPABASE_SERVICE_ROLE_KEY`), nunca produção — o próprio `ci.yml` tem um comentário explícito nesse sentido e falha cedo se as secrets não estiverem configuradas.

**O que ele faz de verdade**:
1. Cria dois escritórios reais (`firmX`, `firmY`), cada um com dono, clientes, documentos (upload real no storage), tarefas e obrigações — dados de verdade gravados no banco de staging, com um prefixo de execução (`iso-<timestamp>`) para permitir limpeza depois.
2. Testa isolamento **entre clientes do mesmo escritório**: o Cliente A não consegue baixar documento do Cliente B, não vê a tarefa do Cliente B no portal, não vê a obrigação nem a mensagem do Cliente B, e o timeline de atividade do Cliente A não vaza evento do Cliente B.
3. Testa isolamento **entre escritórios**: o Escritório Y não consegue resolver documento, cliente, tarefa nem obrigação do Escritório X, mesmo por chamada direta de repositório.
4. Verifica que listagens (`listObligations`, `listTasks`, `listClients`) filtradas pelo Escritório X nunca incluem registro do Escritório Y.
5. Testa acesso a storage: confirma que a service-role key consegue ler qualquer path no bucket (isso é esperado — é uma chave de servidor), e que a proteção real está na camada de proxy/API, testando que o endpoint de streaming de documento nega acesso cross-tenant.
6. Roda uma auditoria estática heurística (`staticAudit`) sobre `src/db/supabase/repositories/*.js`, procurando `.eq('id', …)` sem `.eq('firm_id', …)` ou `.eq('client_id', …)` na mesma cadeia — reporta como **aviso**, nunca falha, porque o próprio código reconhece que há falsos positivos (quando o call site já garante posse do id antes de chamar o repositório).
7. Limpa tudo o que criou, num bloco `finally`, mesmo se algum teste falhar no meio.

**O que não está coberto hoje**: o script tem um segundo bloco, `runApiTests`, que testa os mesmos cenários de cross-tenant só que batendo em endpoints HTTP reais (`/api/contabil/documents/:id/detail`, `/preview`, `/client-tasks/:id`, `/clients/:id`, `/clients/:id/hub`) com tokens JWT de cada escritório. Esse bloco só roda se a variável `API_BASE` (ou `BACKEND_URL`) estiver definida. **O step de CI atual não define essa variável** — então, no pipeline automatizado de hoje, só a camada de serviço/repositório é validada; a camada HTTP (as rotas de verdade, com middleware de auth e roteamento reais) não é exercitada automaticamente. O script fica em modo "warn" nesse caso e não bloqueia o merge.

O gate de falha é: qualquer `fail()` no relatório derruba o processo com código de saída 1; avisos (`warn()`) só derrubam se `TENANT_ISOLATION_FAIL_ON_WARNINGS=true`, e o CI define isso como `false`.

## Auditoria de segurança estática (`backend/scripts/security-static-audit.js`)

Não é uma ferramenta de SAST genérica — não há Semgrep, CodeQL nem plugin de segurança do ESLint no projeto (aliás, não há configuração de ESLint em lugar nenhum, ver seção "O que falta"). É um script próprio com uma lista fixa de ~12 verificações, a maioria checando se um trecho de texto específico está ou não presente em um arquivo específico:

- Helmet está ativo em `src/app.js`.
- Middleware de sanitização de resposta está registrado.
- Hash de senha usa Argon2id (`src/utils/password-crypto.js`).
- CSRF usa o padrão double-submit com header `X-CSRF-Token`.
- Erros são sanitizados em produção (`sanitizeClientDetails`).
- Logs sanitizam campos de senha.
- O mapeamento de `firm-users.repository.js` não expõe `passwordHash` na resposta.
- `legal-consents.service.js` não tem e-mail/telefone do operador hardcoded (regex contra valores específicos conhecidos).
- Rate limit de autenticação usa um store baseado em Redis (não em memória).
- Varredura em todas as rotas/controllers procurando `res.json`/`res.send` que inclua `password_hash`/`passwordHash` — reporta como aviso, não falha.
- Varredura em todo o `src` procurando `eval(...)` ou `new Function(...)` — falha se encontrar.
- `ALLOW_BEARER_AUTH` não é `true` por padrão em `src/config/env.js`.

Cada verificação existe porque, presumivelmente, corrigiu um problema real em algum momento — funciona como um checklist de regressão contra retrocessos conhecidos, não como uma varredura geral de vulnerabilidades. Não vai pegar uma classe de problema nova para a qual ele não foi escrito. Roda via `npm run test:security-static`, sem precisar de nenhuma credencial (só lê arquivos), e é um step separado no CI.

## Testes E2E (Playwright)

Existe de verdade, mas é pequeno. `frontend/playwright.config.cjs` está configurado (Chromium, `webServer` sobe `npm run dev` e aponta para `http://localhost:3000`), e há um único arquivo de spec: `frontend/e2e/public-smoke.spec.ts`, com 3 testes:

1. A landing page tem um H1 visível e menciona "AfDigital" no corpo.
2. As páginas legais (`/aviso-legal`, `/privacidade`) mostram a AfDigital como operadora e não afirmam que o Teglion "atua como Subcontratante" nem que é uma empresa.
3. A página de login do escritório (`/auth/firm/login`) carrega.

Isso é smoke test da superfície pública/institucional — não cobre nenhum fluxo autenticado (dashboard, agenda, documentos, cobrança, portal do cliente). `npm run test:e2e` (frontend) dispara `playwright test`.

**Importante**: esse script `test:e2e` **não aparece no `.github/workflows/ci.yml`**. Ou seja, hoje é um teste manual/local — alguém precisa rodar `npm run test:e2e` explicitamente, não é parte do gate automático de PR. Vale diferenciar isso do script pontual `frontend/scripts/bloco1-staging-shell-qa.mjs`, mencionado em `docs/historico/PHASE-1E.md` como QA de shell responsivo em staging — é um script Playwright avulso para uma verificação específica, não faz parte da suíte `e2e/`.

## O que roda no CI vs. o que é manual

Direto de `.github/workflows/ci.yml` (dispara em push/PR para `main` e `staging`):

| Step do CI | O que faz |
|---|---|
| Frontend typecheck | `npm run tsc` |
| Frontend unit tests | `npm test` (Vitest) |
| Frontend build | `npm run build` |
| Backend unit tests | `npm run test:backend` (os 63 arquivos `node:test`), com env de teste local (sem falar com Supabase/Stripe reais) |
| Backend static security audit | `npm run test:security-static -w backend` |
| Tenant isolation test (staging) | `npm run test:tenant-isolation -w backend`, contra Supabase de staging real — só a camada de serviço/repositório, `API_BASE` não configurada |
| File size limits | `node tools/ci/check-file-sizes.mjs` — guarda de regressão específica: três arquivos que já foram "monólitos" (`api.ts`, `contabil.routes.js`, `contabil.repository.js`) têm um teto de linhas para nunca voltarem a crescer sem controle |
| Secret scan | `node tools/ci/secret-scan.mjs` — regex contra chaves conhecidas (Stripe, Brevo, Google OAuth, Sentry, Supabase, JWT, Redis) coladas em texto plano nos arquivos rastreados pelo git |

**Não está no CI hoje**: testes E2E do frontend (`test:e2e`), lint (não existe script), auditoria de dependências (`npm audit` ou similar não aparece no workflow), e a camada HTTP do teste de isolamento entre tenants.

## O que falta

Lacunas reais, sem tentar suavizar:

- **E2E não roda em CI.** É manual. Só há um arquivo de spec, cobrindo só a superfície pública — nenhum fluxo autenticado tem teste E2E.
- **A camada HTTP do teste de isolamento entre tenants não é exercitada automaticamente.** O gate de CI de hoje só prova isolamento na camada de serviço/repositório; as rotas reais, com middleware de autenticação e roteamento Express reais, não passam por esse teste no pipeline automatizado.
- **Sem SAST genérico.** A "auditoria de segurança estática" é um checklist fixo de ~12 itens conhecidos, não uma ferramenta que descobre problemas novos.
- **Sem auditoria de dependências automatizada visível no CI** (nem `npm audit`, nem Dependabot configurado em `.github/`).
- **Sem ferramenta de cobertura de testes configurada** (nem `c8`, nem `nyc`, nem a cobertura nativa do Vitest habilitada) — não é possível afirmar "X% coberto" para nada neste repositório sem inventar o número.
- **ESLint está instalado no frontend mas não configurado nem usado.** Não há `eslint.config.*`, não há script `lint` em nenhum `package.json`, e não há step de lint no CI. As dependências estão lá; o gate não existe.
- **`test:unit` (backend) é um nome enganoso** — roda um único arquivo, não a suíte. Deveria ser renomeado ou removido para não confundir quem está tentando rodar "só os testes unitários" localmente.
- **A auditoria técnica ampla mencionada no roadmap** (`docs/ROADMAP.md`, item 1.7 — cobertura de testes, performance, dependências) está listada como `EM ANDAMENTO` e não terminou; qualquer achado dela sobre testes deve atualizar este documento quando fechar, não ficar em um documento paralelo.
