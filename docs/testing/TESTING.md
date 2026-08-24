# Testes

Este documento é onde eu registro a estratégia de testes real do Teglion — o que eu de fato tenho hoje, com evidência de código, não o que eu gostaria de ter. Levantei isso em 19/08/2026 lendo diretamente os scripts, os `package.json` e o workflow de CI — não copiei de documentação anterior.

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

Runner: eu uso `node:test`, o test runner nativo do Node — não tenho Jest, Mocha nem Vitest no backend. Pro mocking eu uso o `mock` embutido do próprio `node:test` (dá pra ver em `backend/src/modules/booking/booking.service.test.js`, onde eu uso `mock.method` pra substituir chamadas de repositório).

- Eu tenho 63 arquivos `*.test.js`, todos colocados ao lado do código que testam (não crio pasta `__tests__` separada). Alguns exemplos reais:
  - `backend/src/modules/booking/booking.service.test.js`
  - `backend/src/modules/entitlements/entitlements.service.test.js`
  - `backend/src/db/supabase/repositories/comments-firm-id.test.js`
  - `backend/src/utils/crypto-fields.test.js`
  - `backend/src/middlewares/turnstile.middleware.test.js`
  - `backend/src/config/country-config.registry.test.js`
- A maior concentração eu tenho em `src/modules/firm/` (equipe, convites, serviços, tags, step-up, catálogo CAE) e nas integrações Google Calendar/Drive.
- Alguns testes eu escrevi como guarda-corrimões pontuais e explícitos, não como suítes de comportamento completas — por exemplo, `comments-firm-id.test.js` só confirma que `listComments` rejeita quando chamado sem `firmId`; provavelmente escrevi esse depois de um incidente ou de uma revisão específica (o nome do teste, `SEC-M3`, sugere isso).
- O script que eu realmente uso: `test` no `backend/package.json` roda `NODE_ENV=test node --test 'src/**/*.test.js'` — ou seja, os 63 arquivos, via glob.
- **Nome enganoso que eu preciso lembrar**: eu também tenho um script `test:unit`, que roda **um único arquivo** (`src/utils/file-magic-bytes.test.js`). Não é a suíte unitária completa — deve ser um resquício de quando eu tinha menos testes. No CI eu não uso `test:unit`; uso `test:backend` (raiz do monorepo), que mapeia pro `test` completo do backend.

## Testes unitários — frontend

Runner: eu uso Vitest, com `happy-dom` como ambiente DOM e Testing Library (`@testing-library/react`, `@testing-library/user-event`).

- Eu tenho 33 arquivos `*.test.ts`/`*.test.tsx`, também colocados ao lado do código (mesmo padrão que uso no backend), concentrados em `src/features/firm/`, `src/features/client/` e `src/features/public-intake/`.
- A maioria testa funções auxiliares puras — parsing, formatação, cálculo de datas, regras de navegação, regras de publicação de serviço — não renderização de componente. Só 3 dos 33 arquivos efetivamente montam um componente React: `AgendaServiceHoursPanel.test.tsx`, `ServiceBookingAvailabilitySection.test.tsx` e `TeglionPublicCredit.test.tsx`. O resto é lógica isolada de UI, que testo sem DOM.
- Script real: `test` roda `vitest run`, e é o que roda no CI (`npm test`, que na raiz do monorepo aponta pro workspace `frontend`).
- Preciso lembrar de não confundir isso com o número "28/28 PASS" que cito no registro histórico da Fase 1B (`docs/historico/PHASE-1B.md`) — aquilo era a contagem de testes (não de arquivos) num momento específico de meados de agosto de 2026; o conjunto de arquivos cresceu desde então e eu não tento reconciliar os dois números aqui.

## Teste de isolamento entre tenants (`backend/scripts/tenant-isolation-test.js`)

Esse é o teste mais importante do produto pra mim, porque o Teglion é multi-tenant e o isolamento entre escritórios é o requisito de segurança que define se o produto é vendável ou não. Vale eu descrever com precisão o que ele realmente faz.

**O que não é**: não faz parte da suíte `node --test`. É um script standalone, que eu rodo via `npm run test:tenant-isolation` (ou dentro de `test:security`, que encadeia ele depois da auditoria estática).

**Como roda**: precisa de credenciais reais de Supabase (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). No CI, essas credenciais apontam pro projeto Supabase de **staging** (`STAGING_SUPABASE_URL` / `STAGING_SUPABASE_SERVICE_ROLE_KEY`), nunca produção — deixei um comentário explícito nesse sentido no próprio `ci.yml`, e ele falha cedo se as secrets não estiverem configuradas.

**O que ele faz de verdade**:
1. Cria dois escritórios reais (`firmX`, `firmY`), cada um com dono, clientes, documentos (upload real no storage), tarefas e obrigações — dados de verdade gravados no banco de staging, com um prefixo de execução (`iso-<timestamp>`) pra eu conseguir limpar depois.
2. Testa isolamento **entre clientes do mesmo escritório**: o Cliente A não consegue baixar documento do Cliente B, não vê a tarefa do Cliente B no portal, não vê a obrigação nem a mensagem do Cliente B, e o timeline de atividade do Cliente A não vaza evento do Cliente B.
3. Testa isolamento **entre escritórios**: o Escritório Y não consegue resolver documento, cliente, tarefa nem obrigação do Escritório X, mesmo por chamada direta de repositório.
4. Verifica que listagens (`listObligations`, `listTasks`, `listClients`) filtradas pelo Escritório X nunca incluem registro do Escritório Y.
5. Testa acesso a storage: confirma que a service-role key consegue ler qualquer path no bucket (isso é esperado — é uma chave de servidor), e que a proteção real está na camada de proxy/API, testando que o endpoint de streaming de documento nega acesso cross-tenant.
6. Roda uma auditoria estática heurística (`staticAudit`) sobre `src/db/supabase/repositories/*.js`, procurando `.eq('id', …)` sem `.eq('firm_id', …)` ou `.eq('client_id', …)` na mesma cadeia — reporta como **aviso**, nunca falha, porque eu sei que há falsos positivos (quando o call site já garante posse do id antes de chamar o repositório).
7. Limpa tudo o que criou, num bloco `finally`, mesmo se algum teste falhar no meio.

**O que eu ainda não cubro hoje**: o script tem um segundo bloco, `runApiTests`, que testa os mesmos cenários de cross-tenant só que batendo em endpoints HTTP reais (`/api/contabil/documents/:id/detail`, `/preview`, `/client-tasks/:id`, `/clients/:id`, `/clients/:id/hub`) com tokens JWT de cada escritório. Esse bloco só roda se eu definir a variável `API_BASE` (ou `BACKEND_URL`). **No step de CI atual eu não defino essa variável** — então, no pipeline automatizado de hoje, só a camada de serviço/repositório é validada; a camada HTTP (as rotas de verdade, com middleware de auth e roteamento reais) não é exercitada automaticamente. O script fica em modo "warn" nesse caso e não bloqueia o merge.

O gate de falha que eu configurei é: qualquer `fail()` no relatório derruba o processo com código de saída 1; avisos (`warn()`) só derrubam se `TENANT_ISOLATION_FAIL_ON_WARNINGS=true`, e no CI eu deixei isso como `false`.

## Auditoria de segurança estática (`backend/scripts/security-static-audit.js`)

Não é uma ferramenta de SAST genérica — eu não tenho Semgrep, CodeQL nem plugin de segurança do ESLint no projeto (aliás, não tenho configuração de ESLint em lugar nenhum, ver seção "O que falta"). É um script meu, com uma lista fixa de ~12 verificações, a maioria checando se um trecho de texto específico está ou não presente em um arquivo específico:

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

Cada verificação existe porque, presumo, corrigi um problema real em algum momento — funciona como um checklist de regressão contra retrocessos conhecidos, não como uma varredura geral de vulnerabilidades. Não vai pegar uma classe de problema nova pra qual eu não escrevi verificação. Rodo via `npm run test:security-static`, sem precisar de nenhuma credencial (só lê arquivos), e deixei como um step separado no CI.

## Testes E2E (Playwright)

Isso eu tenho de verdade, mas é pequeno. `frontend/playwright.config.cjs` está configurado (Chromium, `webServer` sobe `npm run dev` e aponta pra `http://localhost:3000`), e eu tenho um único arquivo de spec: `frontend/e2e/public-smoke.spec.ts`, com 3 testes:

1. A landing page tem um H1 visível e menciona "AfDigital" no corpo.
2. As páginas legais (`/aviso-legal`, `/privacidade`) mostram a AfDigital como operadora e não afirmam que o Teglion "atua como Subcontratante" nem que é uma empresa.
3. A página de login do escritório (`/auth/firm/login`) carrega.

Isso é smoke test da superfície pública/institucional — não cobre nenhum fluxo autenticado (dashboard, agenda, documentos, cobrança, portal do cliente). `npm run test:e2e` (frontend) dispara `playwright test`.

**Importante pra eu não esquecer**: esse script `test:e2e` **não aparece no `.github/workflows/ci.yml`**. Ou seja, hoje é um teste manual/local — eu preciso rodar `npm run test:e2e` explicitamente, não é parte do gate automático de PR. Vale eu diferenciar isso do script pontual `frontend/scripts/bloco1-staging-shell-qa.mjs`, que cito em `docs/historico/PHASE-1E.md` como QA de shell responsivo em staging — é um script Playwright avulso pra uma verificação específica, não faz parte da suíte `e2e/`.

## O que roda no CI vs. o que é manual

Direto do `.github/workflows/ci.yml` que eu configurei (dispara em push/PR pra `main` e `staging`):

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

**O que eu ainda não coloquei no CI**: testes E2E do frontend (`test:e2e`), lint (não tenho script), auditoria de dependências (`npm audit` ou similar não aparece no workflow), e a camada HTTP do teste de isolamento entre tenants.

## O que falta

Lacunas reais, sem eu tentar suavizar:

- **E2E não roda em CI.** É manual. Só tenho um arquivo de spec, cobrindo só a superfície pública — nenhum fluxo autenticado tem teste E2E ainda.
- **A camada HTTP do teste de isolamento entre tenants eu ainda não exercito automaticamente.** O gate de CI de hoje só prova isolamento na camada de serviço/repositório; as rotas reais, com middleware de autenticação e roteamento Express reais, não passam por esse teste no pipeline automatizado.
- **Sem SAST genérico.** A minha "auditoria de segurança estática" é um checklist fixo de ~12 itens conhecidos, não uma ferramenta que descobre problemas novos.
- **Sem auditoria de dependências automatizada visível no CI** (nem `npm audit`, nem Dependabot configurado em `.github/`).
- **Sem ferramenta de cobertura de testes configurada** (nem `c8`, nem `nyc`, nem a cobertura nativa do Vitest habilitada) — não consigo afirmar "X% coberto" pra nada neste repositório sem inventar o número.
- **ESLint está instalado no frontend mas eu não configurei nem uso.** Não tenho `eslint.config.*`, não tenho script `lint` em nenhum `package.json`, e não tenho step de lint no CI. As dependências estão lá; o gate não existe.
- **`test:unit` (backend) é um nome enganoso que eu deixei passar** — roda um único arquivo, não a suíte. Preciso renomear ou remover isso pra não me confundir da próxima vez que eu for rodar "só os testes unitários" localmente.
- **A auditoria técnica ampla que listei no roadmap** (`docs/ROADMAP.md`, item 1.7 — cobertura de testes, performance, dependências) está como `EM ANDAMENTO` e eu ainda não terminei; qualquer achado dela sobre testes eu atualizo aqui quando fechar, não deixo num documento paralelo.
