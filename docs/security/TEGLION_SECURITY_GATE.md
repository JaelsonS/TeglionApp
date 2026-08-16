# Teglion Security Gate v1.0

**Branch obrigatória:** `staging` apenas.  
**Ambiente:** staging (`xscriwhchdblmwmpglby` / `https://teglion-api-staging.onrender.com`).

## Veredito global (2026-08-15)

**NO-GO para `main` / produção.** Fatias Cursor (código + static + isolation + smoke HTTP Turnstile) avançaram; **Burp HTTP**, **Stripe Test Mode E2E**, e itens **PENDENTE JAELSON** mantêm o gate global aberto. Contadora em prod diária → sem GO falso.

## Convenção

| Coluna / cor | Significado |
| --- | --- |
| **Cursor** | Veredito **só da parte automatizável/código** do Cursor. |
| **Estado** | Estado **global** do teste (só fica 🟢 global quando todas as partes necessárias fecharam). |
| 🟢 | Aprovado com evidência. |
| 🟡 | **Parcial** — Cursor já fez a fatia, mas falta Burp/HTTP/externo; **ou** achado sem exploit fechado (ex. deps HIGH). |
| 🔴 PENDENTE JAELSON | A tua vez — **não** é vulnerabilidade. |
| 🔴 REPROVADO | Falha comprovada. |
| ⚪ | Cursor ainda não executou a sua parte. |
| 🔵 | Fora de escopo. |
| — | Não aplica a esse actor. |

**Regra:** se Cursor=🟢 e falta Burp → Estado=🟡. Se falta Jaelson → Estado=🔴 PENDENTE JAELSON (mesmo que Cursor=🟢 na sua fatia).

**Amarelo em uma frase:** Cursor OK na sua parte; o gate global ainda não fecha (Burp/HTTP/externo/parcial).

---

## Tabela-mestre

| ID | Teste | Cursor | Estado global | Severidade | Falta | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| P0.01 | Multi-tenant isolation | 🟢 | 🟡 | — | 🛡️ Burp HTTP | Service-layer staging: isolation 24 PASS + probe 18 PASS |
| P0.02 | IDOR / BOLA | 🟢 | 🟡 | — | 🛡️ Burp HTTP | Matriz 99 rotas; cross-tenant service-layer PASS; HTTP não executado |
| P0.03 | Supabase RLS | 🟢 | 🔴 PENDENTE JAELSON | — | 👤 Jaelson (decisão advisors) | RLS ON em todas as tabelas public; 0-policy deny-all OK; advisors WARN RPC/anon |
| P0.04 | RBAC | 🟢 | 🟡 | — | 🛡️ Burp por role | `permissions.js` + `requirePermission`/`requireRole`; units relacionados PASS |
| P0.05 | Privilege escalation | 🟢 | 🟡 | — | 🛡️ Burp | `team.service` bloqueia atribuição OWNER por staff; deactivate revoga sessões |
| P0.06 | Mass assignment | 🟢 | 🟡 | — | 🛡️ Burp body | Serviços usam `firmId` da sessão; playbook pede inject `firm_id` no Burp |
| P0.07 | Authentication | 🟢 | 🟡 | — | 🛡️ Burp fluxos | Static: Argon2id, lockout BD, Turnstile, cookies httpOnly; login real Burp |
| P0.08 | JWT / Session | 🟢 | 🟡 | — | 🛡️ Burp cookies | refresh unit PASS; staging `BEARER_NOT_ALLOWED`; claims assinadas |
| P0.09 | Platform Admin | 🟢 | 🔴 PENDENTE JAELSON | — | 👤 confirma 🔵 | Sem API/papel Platform Admin; `PLATFORM_OWNER` só legado FE → Cursor: 🔵 candidato |
| P0.10 | Stripe | 🟢 | 🔴 PENDENTE JAELSON | — | 👤 Test Mode E2E | Ver secção P0.10 abaixo |
| P0.11 | Webhooks | 🟢 | 🟡 | — | 🛡️ replay/Stripe CLI | `constructEvent` + 400 sem signature; raw body; idempotência `23505` |
| P0.12 | Google OAuth / Calendar | 🟢 | 🟡 | — | 🛡️ callback | state em cookie + validação; redirects só `FRONTEND_URL`; unit oauth PASS |
| P0.13 | Storage / Documents | 🟢 | 🟡 | — | 🛡️ HTTP download | Isolation: proxy CT 404/403; service_role só no servidor |
| P0.14 | Secrets | 🟢 | 🟢 | — | — | `npm run security:secrets` PASS (tracked files limpos) |
| P0.15 | Dependencies | 🟡 | 🟡 | HIGH (deps) | auth fix deps | `npm audit`: 6 vulns / 4 HIGH — documentado, **não** corrigido |
| P1.01 | Information Gathering | 🟢 | 🟡 | — | 🛡️🌐 | Inventário FE/API/Supabase/staging URLs feito |
| P1.02 | Attack Surface | 🟢 | 🟢 | — | — | ~288 handlers; dual `/api`+`/api/v1`; 99 rotas com ID |
| P1.03 | Security Misconfiguration | 🟢 | 🟡 | — | 🌐 WAF/TLS full | `test:security-static` 0 falhas |
| P1.04 | CORS | 🟢 | 🟡 | — | 🛡️ Origin attack | Unit `cors-critical-origins` PASS (staging ≠ prod origins) |
| P1.05 | CSRF | 🟢 | 🟡 | — | 🛡️ sem token | Static: CSRF double-submit + `X-CSRF-Token` |
| P1.06 | Security Headers | 🟢 | 🟡 | — | 🌐 scanner | Helmet no app; HSTS observado no health staging |
| P1.07 | Input Validation | 🟢 | 🟡 | — | 🛡️ fuzz | express-validator em auth routes; não fuzz completo |
| P1.08 | SQL Injection | 🟢 | 🟡 | — | 🛡️ filtros | Acesso via Supabase client (queries parametrizadas) |
| P1.09 | XSS | 🟢 | 🟡 | — | 🛡️ Burp/browser | DOMPurify allowlist em `sanitizeServiceHtml`; `SanitizedServiceHtml` |
| P1.10 | DOM XSS | 🟢 | 🟡 | — | 🛡️ Burp | HTML só via sanitizer; sem `eval` óbvio nas superfícies auditadas |
| P1.11 | HTML Injection | 🟢 | 🟡 | — | 🛡️ Burp | Tags: b/strong/i/em/ul/ol/li/br/p/div; `ALLOWED_ATTR: []` |
| P1.12 | Path Traversal | 🟢 | 🟡 | — | 🛡️ | Paths storage construídos no backend; Burp em params pendente |
| P1.13 | File Upload | 🟢 | 🟡 | — | 🛡️ | Unit `file-magic-bytes` PASS |
| P1.14 | Error Handling | 🟢 | 🟡 | — | 🛡️ | Static + unit error sanitize PASS |
| P1.15 | Sensitive Data Exposure | 🟢 | 🟡 | — | 🛡️ | `mapFirmUser` sem passwordHash; response-sanitize PASS |
| P1.16 | Rate Limiting | 🟢 | 🟡 | — | 🛡️ abuso | Auth rate-limit + Redis store no static audit PASS |
| P1.17 | Business Logic | ⚪ | 🔴 PENDENTE JAELSON | — | 👤 | Fluxos manuais (agendamento/pagamento) |
| P1.18 | Open Redirect | 🟢 | 🟡 | — | 🛡️ | OAuth → só `FRONTEND_URL/*`; `openExternalUrl` unit 2 PASS |
| P1.19 | Parameter Pollution | 🟢 | 🟡 | — | 🛡️ | `firmId`/preços da sessão/servidor, não de query arrays |
| P1.20 | Client-side authorization | 🟢 | 🟡 | — | 🛡️ UI bypass | `ProtectedRoute` / `RequireFirmAccess`; auth real = API |
| P1.21 | LocalStorage/sessionStorage | 🟢 | 🟢 | — | — | JWT não persistido; só prefs/consent/UI |
| P1.22 | Cookie security | 🟢 | 🟡 | — | 🛡️ DevTools | Código: httpOnly, Secure, SameSite, Path=/api |
| P1.23 | Cache security | 🟢 | 🟡 | — | 🛡️🌐 | Docs: `Cache-Control: private, max-age=120`; API JSON sem CDN público |
| P1.24 | Source maps | 🟢 | 🟡 | — | 🌐 staging asset | `vite.config` **sem** `build.sourcemap: true` (default off) |
| P1.25 | API inventory | 🟢 | 🟢 | — | — | Inventário completo no gate/playbook |
| P1.26 | API versioning | 🟢 | 🟢 | — | — | `/api/v1` + `/api` com `Deprecation: true` |
| P1.27 | Deprecated endpoints | 🟢 | 🟡 | — | 🛡️ uso real | Header deprecation confirmado no código |
| API1 | BOLA | 🟢 | 🟡 | — | 🛡️ | = P0.02 |
| API2 | Broken Auth | 🟢 | 🟡 | — | 🛡️ | = P0.07/08 |
| API3 | Property-level auth | 🟢 | 🟡 | — | 🛡️ | = P0.06 |
| API4 | Resource consumption | 🟢 | 🟡 | — | 🛡️ | Rate limits auth OK; DoS global não testado |
| API5 | Function-level auth | 🟢 | 🟡 | — | 🛡️ | = P0.04/05 |
| API6 | Sensitive business flows | 🟢 | 🔴 PENDENTE JAELSON | — | 👤 Test Mode | = P0.10 fatia código; E2E pagamento Jaelson |
| API7 | SSRF | 🟢 | 🟡 | — | 🛡️ | Fetch só Google APIs fixas / Stripe SDK; sem URL user-controlled |
| API8 | Misconfiguration | 🟢 | 🟡 | — | 🌐 | = P1.03 |
| API9 | Inventory | 🟢 | 🟢 | — | — | = P1.25 |
| API10 | Unsafe API consumption | 🟢 | 🟡 | — | 🛡️ | Integrações Google/Stripe com URLs fixas + secrets server-side |
| P2.01 | Advanced injection | ⚪ | 🟡 | — | 🛡️🌐 | — |
| P2.02 | Infra CF/Render/TLS | ⚪ | 🟡 | — | 🌐 EXTERNO | — |
| P2.03 | Backup / DR | 🟢 | 🔴 PENDENTE JAELSON | — | 👤 confirma drill | Docs + drill 2026-08-13 em `BACKUP_RESTORE.md` / R2 |
| P2.04 | Logging / Monitoring | 🟢 | 🔴 PENDENTE JAELSON | — | 👤 Sentry/alertas | `logSanitizationMiddleware` (JWT/password/email/…); Sentry 5xx |
| P1.28 | Public intake forms | 🟢 | 🟡 | — | 🛡️ Burp browser | Turnstile **fail-closed** em staging (smoke 2026-08-15): POSTs sem token → `403 TURNSTILE_MISSING` em intake/lead, submit e newsletter; ver secção deploy abaixo + `PUBLIC_SURFACE_AUDIT.md` |
| P3.01 | Hardening | ⚪ | 🔴 PENDENTE JAELSON | — | 👤+🌐 | — |

---

## P0.10 Stripe — evidência Cursor (2026-08-15)

### O que o Cursor fechou (🟢)

1. **Billing SaaS checkout** (`billing.service.createCheckoutSession`):
   - `firmId` = `req.user.firmId` (não body).
   - `price` = `resolveSubscriptionPriceId(country, interval)` via env `STRIPE_PRICE_*` (cliente **não** manda `amount`/`price_id`).
   - Body só aceita `interval` month|year.
   - Rotas: `POST /billing/checkout` e `/portal` com `requireFirmOwner`.
2. **Connect pagamentos cliente→escritório** (`connect-payments.service`):
   - `unit_amount` = `service.priceCents` da BD (`findByIdForFirm`), não do body.
   - Webhook: rejeita `amount_mismatch` se `session.amount_total !== payment.amountCents`.
   - Metadata `firmId` cruzada com payment local.
3. **Webhooks** (billing + connect):
   - `express.raw` antes de `express.json`.
   - `constructEvent` + 400 sem/`invalid` signature.
   - Idempotência: insert `event_id` unique → skip `23505`.
4. **Units:** billing-access + connect-access + connect-payments + pricing-plans + entitlements → **17–19 PASS / 0 FAIL**.
5. **Stripe MCP:** conta ligada = **livemode** (`AfDigital…`). Cursor **não** executou mutações live nem checkout real.

### INFORMATIONAL (defense-in-depth, sem exploit cliente)

- Em `checkout.session.completed` (billing), `firmId` vem de `metadata` / `client_reference_id` sem revalidar `customer` ↔ `firms.stripe_customer_id`. Cliente não forja webhook (assinatura). Melhoria opcional pós-gate.

### O que falta (Estado 🔴 PENDENTE JAELSON)

- Checkout + portal + Connect charge em **Stripe Test Mode** (cartão teste, webhook CLI/dashboard).
- Confirmar que staging API usa `sk_test` / prices de teste (não validado aqui — sem ler secrets).
- Burp: inject `amount`/`price_id`/`firm_id` no body de checkout → deve ignorar.

---

## Resumo Cursor (o que já fechei)

### 🟢 Cursor aprovado (parte Cursor feita)

P0.01–P0.14 (exceto P0.15 parcial), P1.01–P1.16, P1.18–P1.27, API1–API10 (API6 global ainda Jaelson), P2.03–P2.04 (global Jaelson)

\*P0.03/P0.09/P0.10/P2.03/P2.04: Cursor 🟢 na análise; **Estado global** 🔴 até Jaelson.

### 🟡 Cursor parcial

- **P0.15** — `npm audit` 4 HIGH. Sem fix sem tua auth.

### ⚪ Cursor ainda não executou

P1.17 (só manual), P2.01, P2.02, P3.01

---

## Achados / evidências chave

**Secrets:** limpo.  
**Static:** 0 falhas.  
**Isolation staging:** 24+18 PASS.  
**Stripe código+units:** PASS (P0.10 Cursor).  
**Deps:** 6 vulns (4 HIGH) — P0.15.  
**RLS:** ON; advisors WARN RPC/anon.  
**HTML:** DOMPurify allowlist (sem attrs).  
**Source maps:** off no Vite build config.  
**Backup docs:** drill 2026-08-13 registado.

**INFORMATIONAL:** `news.updateArticle` cross-tenant → `PGRST116` (sem escrita).  
**INFORMATIONAL:** billing webhook metadata `firmId` sem bind customer↔firm.

---

## Deploy staging + smoke (2026-08-15) — PR #47

**Merge:** `fix/firm-tags-turnstile-public-ux` → `staging` (`206c322`). CI validate PASS.

| Check | Resultado |
| --- | --- |
| API `GET /api/public/health` | `200` `{"ok":true}` |
| FE `https://staging.teglion.com` | `200` |
| POST intake/lead sem Turnstile | `403` `TURNSTILE_MISSING` |
| POST submit sem Turnstile | `403` `TURNSTILE_MISSING` |
| POST newsletter sem Turnstile | `403` `TURNSTILE_MISSING` |
| Migration tag links | já aplicada no Supabase staging |

**UAT manual (Jaelson):** Definições → Etiquetas; Client Hub chips; filtro clientes; tags equipa; Solicitações sync; intake público com widget Turnstile OK (não só 403); frase de destaque no editor público.

**Turnstile widget no login (2026-08-15):** sitekey presente no bundle staging (`0x4AAAAA…`). Erro «verificação não concluiu» = `error-callback` do widget (domínio Cloudflare / overlay). Código: banner cookies desactivado em `/auth` + mensagem com hint de hostname. **Confirmar no painel Cloudflare** que `staging.teglion.com` está nos hostnames do widget — MANUAL JAELSON.

**Não fecha o gate global** — falta Burp + Stripe E2E + decisões Jaelson (tabela-mestre).

---

## Playbooks

- `docs/security/BURP_P0_HTTP_PLAYBOOK.md`
- `docs/security/BURP_PUBLIC_PORTAL_PLAYBOOK.md`
- `docs/security/seed-staging-demo-ops.js`
