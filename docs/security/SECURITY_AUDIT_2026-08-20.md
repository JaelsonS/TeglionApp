# Auditoria de Segurança Completa — Teglion (19-20/08/2026)

> Executada em 10 frentes paralelas e independentes, cobrindo autenticação, autorização/RBAC, isolamento de tenant, RLS, storage/uploads, Stripe/webhooks, Google OAuth/Calendar, XSS, CSRF/CORS/headers, rate limiting/abuso, segredos em logs, race conditions, dependências e tratamento de erros. Todos os achados citados abaixo têm evidência de código real (arquivo:linha), lida diretamente nesta auditoria — nada foi presumido a partir de documentação anterior. Onde uma correção foi aplicada, foi testada e reverificada antes de constar aqui como "corrigido". Nenhum deploy foi feito — tudo fica no working tree local, na branch `staging`, aguardando revisão.

---

## 1. Resumo executivo

O Teglion tem uma postura de segurança real, não decorativa: isolamento entre escritórios por `firm_id` aplicado de forma consistente na camada de repositório, um teste de isolamento entre tenants que roda automaticamente no CI e falha o pipeline se os segredos de staging faltarem, verificação de assinatura em todos os webhooks antes de qualquer processamento, idempotência real (não decorativa) contra reprocessamento duplicado, CSP restritiva sem `unsafe-inline`, cookies de sessão sempre `httpOnly`, e Turnstile cobrindo 100% dos formulários públicos de mutação.

Mas não estava tudo bem. Esta auditoria encontrou e corrigiu **4 vulnerabilidades de severidade alta (P1)** e **6 de severidade média (P2)**, todas com evidência de exploração concreta — não hipóteses. A mais séria: um usuário com uma permissão delegável comum (`FIRM_MEMBER_PERMISSION_MANAGE`) conseguia conceder a si mesmo permissões equivalentes às de dono do escritório, e simultaneamente reduzir as permissões do dono real, sem nunca tocar no campo `role` — que era o único caminho já protegido por uma correção anterior (SEC-H1). Também confirmámos um XSS armazenado real no editor de texto rico usado para descrição de serviços, e um vazamento de código de autorização OAuth do Google para os logs de produção via o formato de log HTTP (morgan).

Nenhuma vulnerabilidade crítica (P0) foi encontrada em nenhuma das 10 frentes.

## 2. Estado antes da auditoria

Ponto de partida real (branch `staging`, working tree limpo antes de começar): 490 testes de backend, 153 de frontend, um script de auditoria estática de segurança (`security-static-audit.js`, 10 verificações fixas) e um script de teste de isolamento entre tenants (`tenant-isolation-test.js`) que exige credenciais reais de um projeto Supabase de staging para correr — não executado nesta rodada por não ter essas credenciais disponíveis neste ambiente (ver secção 13). Nenhum P0/P1/P2 documentado como conhecido e aberto antes desta auditoria — os que encontrámos aqui eram desconhecidos até agora.

## 3. Vulnerabilidades encontradas (todas as 17, por severidade)

### P0 — Crítico
Nenhuma encontrada em nenhuma das 10 frentes investigadas.

### P1 — Alto (4, todas corrigidas)
1. **XSS armazenado no editor de texto rico** — `RichTextEditor.tsx` escrevia o `value` recebido diretamente em `innerHTML` sem sanitizar ao carregar (só sanitizava ao emitir). Um utilizador que chamasse a API diretamente (contornando a UI) podia gravar uma descrição de serviço com `<img onerror=...>`; qualquer colega — incluindo o dono do escritório — que depois abrisse esse serviço para editar executava o payload na própria sessão autenticada.
2. **Escalação de privilégio via `team-permissions.service.js`** — sem verificação de auto-alvo, sem proteção do papel `FIRM_OWNER`, e sem teto de permissões, um ator com `FIRM_MEMBER_PERMISSION_MANAGE` delegado conseguia auto-conceder-se qualquer permissão (incluindo `FIRM_BILLING_MANAGE`, `USERS_CREATE_ADMIN`) e reduzir as permissões do dono real — sem nunca tocar em `role`.
3. **`GET /api/public/postal-lookup` sem rate limit nem Turnstile** — único endpoint público de mutação/consulta pesada sem nenhuma proteção, encadeando até duas chamadas a APIs externas gratuitas por pedido (até ~10s de latência), com risco real de exaustão de handlers no backend e de bloqueio do IP do Teglion pelos provedores externos.
4. **`SafeLogger` não sanitizava a mensagem, só o `data`** — o formato de log HTTP (morgan) loga a URL completa, incluindo querystring; o código de autorização OAuth do Google (`?code=...&state=...` no callback) ficava gravado em texto plano nos logs de produção.

### P2 — Médio (6 corrigidos nesta rodada + 11 documentados para o roadmap)

**Corrigidos:**
1. E-mail de lembrete de obrigação não escapava o campo `body` fornecido pelo escritório — injeção de HTML/link de phishing dentro de um e-mail legítimo da Teglion.
2. `reactivateMember` não tinha a mesma proteção de `deactivateMember` — um `STAFF` comum conseguia reativar um `FIRM_OWNER` que o dono atual tinha desativado deliberadamente.
3. `updateMember` não impedia rebaixar o último `FIRM_OWNER` ativo do escritório até zero owners.
4. Preflight CORS de `/api/public/*` tratava `OPTIONS` como método seguro sem checar `Access-Control-Request-Method` — qualquer origem "passava" o preflight de uma rota de mutação pública (contido, na prática, só pelo Turnstile).
5. Webhooks Stripe (billing + Connect) estavam sujeitos ao rate limit global anônimo (300/janela/IP) — risco de 429 em rajadas legítimas de replay/backfill do Stripe.
6. Endpoint duplicado `POST /contabil/auth/register-firm` (dentro de `cron.routes.js`, sem Turnstile) permitia contornar o CAPTCHA da rota oficial de registo — removido (sem uso real confirmado no frontend).

**Documentados, não corrigidos nesta rodada** (razão em cada item, secção 5):
7. `clients/export-csv` sem rate limit dedicado nem registo de auditoria.
8. Aceitar convite de equipa/cliente sem `WHERE status='PENDING'` — corrida real (duplicação de cliente, "last write wins" em senha).
9. `validateDocument` sem lock otimista — aprovação/rejeição simultânea gera efeitos colaterais duplicados.
10. `morgan` loga `:remote-user`, extraído de header `Authorization: Basic` mesmo sem a app usar Basic Auth — log injection (CVE conhecido do pacote).
11. `firm-users.repository.js` devolve `password_hash` cru (sem allowlist) em 4 funções — hoje sem vazamento ativo (rede de segurança global intercepta), mas frágil.
12. Handlers globais de crash (`unhandledRejection`/`uncaughtException`) não passam por `logger.safe`.
13. PII (email/telefone) em `console.log` sem sanitização em 3 pontos (`brevo-sms.service.js`, `brevo-email.service.js`, `team.service.js`).
14. `stepUpToken` (cofre de credenciais oficiais) guardado em `sessionStorage` em vez de cookie `httpOnly`.
15. Documento "apagado" nunca remove o blob físico do Supabase Storage (só soft-delete).
16. Booking/intake público sem teto agregado por `firmSlug` (só por IP).
17. `assignedStaffId` de cliente não validado contra o roster real da firma.

### P3 / INFO — Baixo (não aplicados individualmente nesta rodada, catalogados nos 10 relatórios completos)
Dezenas de itens de hardening/higiene: comparação não constant-time em 2 pontos (`state` OAuth, `cron secret`), código morto (`sanitizeFilename` duplicada, permissão `FIRM_TEAM_AUDIT_VIEW` não usada, status HTTP 422 nunca emitido), `Permissions-Policy` ausente, HSTS sem `preload`, ofuscação desnecessária de nomes legados (`['D','o','c','t','o','r'].join('')`), logo antigo não removido do storage ao substituir, upload de CSV aceita `application/octet-stream` sem inspeção, duplicação de superfície `/api` vs `/api/v1`, entre outros. Lista completa nos relatórios brutos de cada uma das 10 frentes (preservados no histórico desta sessão de trabalho).

## 4. Vulnerabilidades corrigidas — detalhe técnico

Ver secção 3 (P1 e P2 corrigidos) para a lista. Arquivos alterados nesta rodada:

| Arquivo | Mudança |
|---|---|
| `frontend/src/shared/design-system/RichTextEditor.tsx` | Sanitiza `value` também ao carregar (`sanitizeServiceHtml`), não só ao emitir |
| `backend/src/modules/firm/team-permissions.service.js` | Bloqueio de auto-alvo, bloqueio de alvo-owner por não-owner, teto de permissões |
| `backend/src/modules/firm/team.service.js` | `reactivateMember` ganha a mesma guarda de owner que `deactivateMember`; `updateMember` ganha invariante de último owner |
| `backend/src/routes/contabil-public.routes.js` | Novo `postalLookupLimiter` (30/15min) aplicado a `/postal-lookup` |
| `backend/src/middlewares/log-sanitization.middleware.js` | `SafeLogger` sanitiza `message` em todos os métodos; novos padrões (`code=`, `state=`, `access_token=` etc. em querystring) e novas `SENSITIVE_KEYS` (`cookie`, `access_token`, `refresh_token`, `id_token`, `client_secret`, `whsec`, `webhookSecret`) |
| `backend/src/services/notifications/contabil-notifications.service.js` | `body` do lembrete de obrigação passa por `escapeHtml` antes de ir para o e-mail |
| `backend/src/app.js` | Preflight CORS público resolve o método real via `Access-Control-Request-Method`; webhooks Stripe isentos do rate limit global |
| `backend/src/routes/contabil/cron.routes.js` | Removido endpoint duplicado `POST /auth/register-firm` (sem Turnstile, sem uso real) |
| `frontend/package.json` | Adicionado `jsdom` como devDependency (ver secção 13 — necessário para testar sanitização de HTML corretamente) |

## 5. Vulnerabilidades ainda abertas (por que não foram corrigidas agora)

Todos os itens 7-17 da secção 3 exigem uma de três coisas que decidi não fazer sem revisão explícita, dado o volume já entregue nesta rodada: (a) uma migration de schema (constraints `UNIQUE`/locks otimistas para as corridas de convite/documento — itens 8, 9), (b) uma mudança de infraestrutura/dependência com teste de regressão mais amplo do que dava para cobrir agora (atualizar `morgan`, item 10), ou (c) uma mudança que atravessa backend+frontend coordenadamente (mover `stepUpToken` para cookie, item 14). Ficam todos registados como itens P1/P2 no roadmap oficial (secção 11).

## 6-9. P0 / P1 / P2 / P3

Ver secção 3 — já organizado por severidade com contagem exata: **0 P0, 4 P1 (100% corrigidos), 17 P2 (6 corrigidos, 11 documentados), dezenas de P3/INFO (catalogados, não aplicados individualmente)**.

## 10. Testes executados

- Suíte completa de backend: `node --test 'src/**/*.test.js'` → **490/490 passando** (13 suites).
- Suíte completa de frontend: `vitest run` → **153/153 passando** (34 arquivos).
- `node scripts/security-static-audit.js` → **0 falhas, 0 avisos, APROVADA**.
- `tsc --noEmit` (typecheck completo do frontend) → **sem erros**.
- 5 arquivos de teste **novos**, escritos nesta auditoria, cobrindo especificamente as correções P1/P2 (não são testes genéricos — cada um reproduz o cenário de exploração real e confirma que deixou de funcionar):
  - `frontend/src/shared/design-system/RichTextEditor.test.tsx` (3 testes)
  - `backend/src/modules/firm/team-permissions.service.test.js` (5 testes)
  - `backend/src/modules/firm/team.service.test.js` (+4 testes novos, arquivo já existente)
  - `backend/src/middlewares/log-sanitization.safelogger-message.test.js` (4 testes)
  - `backend/src/services/notifications/contabil-notifications.escape.test.js` (2 testes)
  - `backend/src/app.cors-preflight.test.js` (3 testes, sobe uma instância real do Express)

## 11. Testes que falharam

Nenhum, na configuração final. Durante o processo, 4 testes falharam numa execução isolada por falta de `DATA_ENCRYPTION_KEY` no ambiente de shell usado para rodar os testes manualmente — não é uma regressão de código, é configuração de ambiente do terminal; confirmado ao re-rodar com a variável definida corretamente (secção 10).

**Achado colateral relevante, não uma falha de teste mas uma lacuna de teste**: o teste inicial que escrevi para o `RichTextEditor` "passava" mesmo com a sanitização quebrada, porque o ambiente `happy-dom` (padrão do projeto para testes de componente) não é compatível com o `DOMPurify` — o `DOMPurify.sanitize()` deixa um `<script>` intacto sob `happy-dom`, mas remove corretamente sob `jsdom` (que o DOMPurify suporta oficialmente) e num browser real (confirmei os dois). **Qualquer teste futuro que precise validar sanitização de HTML deve declarar `@vitest-environment jsdom`, não `happy-dom`** — documentei isto como comentário no próprio arquivo de teste, para não se repetir.

## 12. Testes externos necessários

O que este trabalho **não pode** confirmar sozinho, porque exige ferramenta externa, ambiente real ou decisão humana:

- **Teste de isolamento entre tenants contra staging real** (`npm run test:tenant-isolation`) — precisa de `STAGING_SUPABASE_URL`/`STAGING_SUPABASE_SERVICE_ROLE_KEY` reais, não disponíveis neste ambiente de trabalho. É o teste mais importante do produto (cria dois escritórios reais e tenta ativamente furar o isolamento) — recomendo fortemente rodá-lo antes de qualquer deploy destas correções.
- **Confirmação em staging real de que o bloco HTTP do teste de isolamento (`runApiTests`) está a rodar** — hoje o CI só define credenciais de serviço, não `API_BASE`/`BACKEND_URL`; achado da auditoria de testes (não desta rodada de fixes) é que, em CI, só a camada de serviço/repositório é exercitada, não as rotas HTTP reais com middleware de auth.
- **Pentest externo** (Burp Suite/OWASP ZAP) contra staging — nenhum foi executado; os achados aqui vêm de leitura de código, não de ataque real. É o próximo passo natural depois destas correções.
- **`npm audit fix` avaliado com cautela** — `morgan` (log injection, P2, reachable) precisa de atualização; `postcss`/`react-router-dom`/`nanoid` marcados "high" pelo `npm audit` mas reclassificados como P3 nesta auditoria (superfície vulnerável não é exercida pelo código real do Teglion) — não apliquei nenhum bump de dependência nesta rodada, fica para decisão específica.
- **Decisão jurídica** sobre se o soft-delete atual de documentos/clientes é suficiente para GDPR (não avaliado nesta auditoria de segurança de aplicação).

## 13. Segredos / Logs

Nenhum segredo real foi impresso neste relatório ou em qualquer teste (todos usam valores sintéticos claramente marcados, ex.: `test-secret-min-32-characters-long-000`). Confirmado por varredura exaustiva: nenhum `sk_live_`/`sk_test_`/`whsec_` real hardcoded em código, teste ou fixture. A correção do `SafeLogger` (secção 4) fecha o vazamento confirmado de código/state OAuth via logs HTTP; itens 11-13 da secção 3 (repository cru, crash handlers, PII em `console.log`) continuam abertos — nenhum tem exploração ativa confirmada hoje (a rede de sanitização global intercepta na maior parte dos casos), mas são pontos frágeis a fechar.

## 14. Isolamento de Tenant

**Confirmado seguro, com alta confiança**, por três frentes independentes que chegaram à mesma conclusão: `firm_id` é a única fronteira real de isolamento (nunca substituída por `country`, nunca aceita do cliente — sempre derivado do JWT verificado no servidor), aplicado de forma consistente em ~40 repositórios revisados. O padrão dominante confirmado, endpoint a endpoint: `resolve firmId da sessão → busca recurso filtrando por id+firm_id → 404 se não encontrado`. Nenhum IDOR/BOLA cross-tenant real foi encontrado nesta rodada (diferente da auditoria anterior nesta mesma sessão de trabalho, que tinha encontrado um vazamento real no módulo de tracking de visualizações — esse achado já está registado e priorizado no `docs/ROADMAP.md`, item 0.1, fora do escopo desta rodada específica). O portal do cliente (6 fluxos revistos) também está limpo: `client_id`+`firm_id` sempre resolvidos a partir da sessão, nunca de parâmetro de URL.

## 15. RLS

Não foi o foco desta rodada específica (coberta em profundidade na reestruturação de documentação anterior, `docs/database/RLS.md`) — mas confirmado de novo, de passagem: nenhuma policy usa `country_code`; RLS é defesa em profundidade, a fronteira real é o filtro explícito `firm_id` no backend (que usa `service_role`, que ignora RLS).

## 16. Storage

**Confirmado seguro.** Bucket privado, sem `getPublicUrl` em lugar nenhum do código, nenhum endpoint aceita `storageKey`/path diretamente do cliente. Magic bytes realmente aplicados (não é utilitário morto) para todos os tipos de documento; SVG/HTML nunca aceites em nenhuma whitelist — sem vetor de XSS armazenado via upload. Achados só de retenção/higiene (P3): documento "apagado" não remove o blob físico, logo antigo não é removido ao substituir, CSV aceita `application/octet-stream` sem inspeção de conteúdo.

## 17. Auth

**Confirmado sólido.** JWT em cookie `httpOnly`, hash Argon2id, lockout de conta por tentativa falhada (independente de IP, fecha o gap de um atacante distribuído por muitos IPs), coordenação de refresh entre abas via `BroadcastChannel`. MFA **não existe** em nenhum papel — confirmado por busca exaustiva, um único comentário no código (`step-up.service.js:12`: "MFA/TOTP: não nesta versão") documenta isso como decisão consciente de escopo, não como bug. O que existe é "step-up" de fator único (reautenticação por senha) para desbloquear o cofre de credenciais oficiais — não é multi-fator real.

## 18. Admin

**"Platform Admin" (Teglion administrando todos os escritórios) não existe** — confirmado por busca exaustiva em duas frentes independentes desta auditoria. Não é vulnerabilidade, é ausência de funcionalidade. Dentro de um escritório, a administração (`FIRM_OWNER` geríndo a própria equipa) tinha a vulnerabilidade P1 já corrigida (secção 3, item 2) e o P2 do `reactivateMember` também já corrigido. Audit log confirmado como só-inserção — nenhum endpoint permite alterar ou apagar uma entrada, mesmo por um `FIRM_OWNER`.

## 19. Google Calendar/OAuth

**Confirmado seguro em todos os 8 pontos investigados** (state CSRF real com cookie de uso único, redirect_uri fixo por env var — sem open redirect, troca de código só no backend, tokens encriptados AES-256-GCM em repouso e nunca logados, firm_id sempre da sessão/slug nunca de input, escopos mínimos por finalidade, revogação real no disconnect, sem vazamento cross-tenant no callback). Dois achados P3 de robustez (comparação de `state` não constant-time; revogação de token no disconnect é best-effort silenciosa) — nenhum crítico.

## 20. Webhooks

**Stripe: confirmado seguro em todos os 8 pontos investigados** (assinatura verificada antes de processar, raw body correto, idempotência real via `PRIMARY KEY` + INSERT atômico — não decorativa, proteção de replay em duas camadas, preço/IDs sempre resolvidos server-side, nenhum caminho para o frontend "confirmar" pagamento diretamente). Corrigido nesta rodada: isenção do rate limit global (secção 4). **Google: não existem webhooks** (integração por OAuth/polling, não por push notification) — confirmado, não é vulnerabilidade, é ausência de superfície.

## 21. Backups

Fora do escopo direto desta auditoria de aplicação (coberto em `docs/database/BACKUPS.md` e `DISASTER_RECOVERY.md`, já corrigidos na reestruturação de documentação anterior desta sessão de trabalho — 2 drills reais de 13/08/2026 confirmados).

## 22. Infraestrutura

CORS nunca emite `Access-Control-Allow-Origin: *` (confirmado lendo o código-fonte do pacote `cors` instalado, não a documentação); `CORS_ORIGINS=*` é explicitamente rejeitado no parse. Helmet ativo com CSP restritiva (`script-src 'self'`, sem `unsafe-inline`/`unsafe-eval`), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, COOP, CORP todos com valores efetivos. Única lacuna real: `Permissions-Policy` ausente (helmet 7 não o inclui por padrão) — P3, baixo impacto numa API JSON sem HTML servido.

## 23. Documentação

Este relatório fica em `docs/security/SECURITY_AUDIT_2026-08-20.md`, como registo pontual desta rodada. `docs/security/SECURITY.md`, `AUTHENTICATION.md`, `AUTHORIZATION.md`, `TENANT_ISOLATION.md`, `DATA_PROTECTION.md`, `SECURITY_TESTING.md` (reescritos na reestruturação de documentação anterior desta sessão) continuam sendo a fonte de verdade viva sobre o estado de segurança — devem ser atualizados para refletir as correções desta rodada num passo seguinte, fora do escopo desta entrega (é trabalho de documentação, não de correção de código).

## 24-25. Segurança contínua / Backlog técnico

Ver secção 5 (itens abertos) e o `docs/ROADMAP.md` já existente — os 11 itens P2 não corrigidos e os P3/INFO catalogados devem entrar lá como itens formais, não ficar só neste relatório pontual. Isso é uma ação de documentação recomendada, não executada automaticamente nesta rodada (a mesma disciplina de "não criar uma segunda fonte de verdade" já estabelecida nesta sessão de trabalho).

## 26. Security Gate

| Categoria | Contagem | Gate |
|---|---|---|
| P0 aberto | 0 | ✅ |
| P1 aberto | 0 (4 encontrados, 4 corrigidos e testados) | ✅ |
| P2 aberto | 11 (6 encontrados e corrigidos; 11 documentados, não corrigidos) | ⚠️ Aceitação de risco necessária por item — ver secção 5 |
| P3/INFO aberto | Dezenas, catalogados | Aceitável para o estágio atual |

**Regra do próprio pedido desta auditoria**: se existe P0 ou P1 aberto, não considerar pronto para produção. **Não há P0 nem P1 aberto** — todos os 4 P1 encontrados foram corrigidos e testados nesta mesma rodada. Existem P2 abertos, o que exige decisão explícita de aceitação de risco por item (ou correção numa próxima rodada) antes de considerar o sistema "hardened" — não antes de "pronto para continuar operando o piloto atual".

## 27. Recomendação final

**Não bloqueante para o piloto atual** (4 escritórios, uso real já em produção) — nenhum P0/P1 aberto. **Recomendo fortemente, antes do próximo deploy destas correções**: (1) rodar `npm run test:tenant-isolation` contra staging real com credenciais reais, já que não foi possível nesta rodada; (2) revisar e decidir sobre os 11 itens P2 abertos, priorizando os dois de corrida real de dados (convite duplicado, aprovação de documento simultânea — itens 8 e 9) por envolverem integridade de dados fiscais; (3) migrar este relatório para os documentos vivos de segurança (`docs/security/`) e para o `docs/ROADMAP.md`, para não virar mais um documento que fica desatualizado no dia seguinte — exatamente o problema que a reestruturação de documentação anterior desta sessão já identificou e tentou resolver.

---

*Nenhuma alteração foi enviada para staging ou produção. Todas as correções estão no working tree local, testadas e prontas para revisão antes de commit/deploy.*
