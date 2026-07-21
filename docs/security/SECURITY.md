# Teglion — Segurança

**Documento oficial · Última actualização: Julho 2026**

Esta é a política de segurança que eu uso para operar o Teglion com previsibilidade e sem fragilizar produção.
Define controlos, riscos, responsabilidades e requisitos para um SaaS que processa dados fiscais e pessoais.

---

## Princípios

| Princípio | Regra |
|-----------|-------|
| **Defence in depth** | Múltiplas camadas — edge, API, app, database |
| **Least privilege** | RBAC granular; service role só no backend |
| **Fail secure** | Erro de auth = 401; erro de tenant = 403; nunca 200 com dados errados |
| **Zero trust** | Frontend nunca é fonte de identidade; JWT validado no servidor |
| **Audit everything sensitive** | Auth, downloads, hub fiscal, acções IA |
| **Privacy by design** | Minimizar PII em logs, prompts IA e metadata |

---

## Modelo de ameaças

| Ameaça | Vector | Impacto | Mitigação |
|--------|--------|---------|-----------|
| Cross-tenant data leak | Bug no scoping `firm_id` | Crítico | Tenant isolation tests + code review |
| Account takeover | Brute force, credential stuffing | Alto | Lockout + rate limit + Argon2id |
| XSS | Input não sanitizado | Alto | React escape + escapeHtml em pontos críticos |
| CSRF | Form submission cross-origin | Alto | Double-submit cookie + header |
| SQL/PostgREST injection | Filtros `.or()` / `.ilike()` | Alto | `postgrest-filter.js` escape |
| File upload attack | MIME spoofing, malware | Médio | Magic bytes + whitelist + size limit |
| Session hijacking | Token em localStorage | Alto | Cookies httpOnly only |
| DDoS | Volume de requests | Médio | Rate limit + WAF (planeado) |
| Insider threat | Staff malicioso | Médio | Audit logs + RBAC |
| IA data leak | Prompt com PII cross-tenant | Alto | Gateway scoped + PII filter |

---

## Autenticação

### Fluxo

```
Login → verify password (Argon2id/bcrypt) → issue JWT pair
  → Set-Cookie: accessToken (httpOnly, 15min)
  → Set-Cookie: refreshToken (httpOnly, 30d)
  → Store refresh jti in auth_refresh_sessions

Convites de equipa:

1. `team invite` cria membro inativo com `invite_status=PENDING`
2. colaborador define palavra-passe via token de convite
3. login bloqueado com `EMAIL_NOT_CONFIRMED` até confirmação por token de e-mail
4. confirmação ativa conta (`is_active=true`) e permite login
```

### Tokens

| Token | Duração | Storage | Conteúdo |
|-------|---------|---------|----------|
| Access | 15 min | Cookie httpOnly | `{ sub, role, clinicId, clientId? }` |
| Refresh | 30 dias | Cookie httpOnly | `{ sub, jti }` |
| CSRF | Sessão | Cookie + memória | Random token |

### Passwords

| Regra | Valor |
|-------|-------|
| Algoritmo (novo) | Argon2id |
| Algoritmo (legacy) | bcrypt — migrado no login |
| Mínimo | 10 caracteres |
| Complexidade | Maiúscula + minúscula + dígito |
| Reset | Token único, expira 1h, invalida sessões |

### Brute force protection

| Parâmetro | Valor |
|-----------|-------|
| Max falhas | 5 em 15 min |
| Lockout | 15 min |
| Delay progressivo | Sim |
| Mensagem UI | Genérica (anti-enumeração) |

### SSO

- Google OAuth2 para staff do escritório
- Callback validado; email verificado no provider

---

## Autorização (RBAC)

### Roles

| Role | Escopo |
|------|--------|
| `FIRM_OWNER` | Tudo no escritório |
| `FIRM_STAFF` | Operações (sem billing/team delete) |
| `FIRM_CONSULTANT` | Clientes atribuídos |
| `CLIENT` (JWT: PATIENT) | Portal do cliente |

Permissões por utilizador:

- Baseadas no role por defeito
- `permissions_override` opcional por membro (modo `OVERRIDE`)
- Middleware de autorização considera override quando presente

### Permissões (alvo — Fase 1 limpa legacy)

```
FIRM_CLIENTS_VIEW / FIRM_CLIENTS_MANAGE
FIRM_DOCUMENTS_MANAGE
FIRM_TASKS_MANAGE
FIRM_OBLIGATIONS_MANAGE
FIRM_MESSAGES_MANAGE
FIRM_BILLING_MANAGE
FIRM_SETTINGS_MANAGE
FIRM_TEAM_MANAGE
FIRM_REPORTS_VIEW
```

**Regra:** Toda rota autenticada tem `requirePermission()` explícito.

### Tenant isolation

```
JWT.clinicId (= firmId) → contabil-scope → repository.eq('firm_id', firmId)
```

- Frontend **nunca** envia `firmId`
- Backend **nunca** confia em IDs do body sem verificar pertença
- Testes: `npm run test:tenant-isolation`

---

## Transporte e headers

### HTTPS

- Obrigatório em produção
- HSTS via Vercel (frontend) e Helmet (backend)

### CORS

- Origens exactas em `CORS_ORIGINS`
- `credentials: true`
- Sem wildcard em produção

### Helmet (backend)

- CSP, X-Frame-Options, X-Content-Type-Options
- Referrer-Policy

### CSP (frontend — Vercel)

- Scripts restritos
- `unsafe-inline` em styles (Tailwind) — risco aceite
- WAF Cloudflare recomendado (Fase 7)

### Cookies

| Cookie | httpOnly | Secure | SameSite |
|--------|----------|--------|----------|
| accessToken | ✅ | ✅ | none (cross-origin) |
| refreshToken | ✅ | ✅ | none |
| csrfToken | ❌ | ✅ | none |

---

## CSRF

- Double-submit: cookie `csrfToken` + header `X-CSRF-Token`
- Validação em toda mutação (POST, PUT, PATCH, DELETE)
- Rotas públicas de auth aceitam `X-Requested-With: XMLHttpRequest` em WebViews

---

## Rate limiting

| Contexto | Limite | Store |
|----------|--------|-------|
| Global | 100/15min/IP | Redis (prod) / memory (dev) |
| Autenticado | 600/15min/user | Redis |
| Login | 20/15min/IP | Redis |
| Registo | 5/15min/IP | Redis |
| Newsletter | 5/hora/IP | Redis |

**Regra:** `REDIS_URL` obrigatório em produção multi-instância.

Execução operacional que eu sigo:

1. Eu mantenho Redis activo no Render para evitar fallback in-memory.
2. Eu não aprovo release com warning de fail-open em produção.
3. Eu valido lockout e rate limit no gate de release.

Referência prática: [REDIS_RENDER_SETUP.md](../operations/REDIS_RENDER_SETUP.md)

---

## Upload de ficheiros

| Controlo | Implementação |
|----------|---------------|
| Tamanho | 25MB default (configurável) |
| MIME whitelist | PDF, images, Office, ZIP |
| Magic bytes | Validação pós-multer |
| Storage | Supabase Storage only — sem fetch URL externa |
| Path | `firm/{firmId}/clients/{clientId}/...` — sem path traversal |
| Download | Signed URL com TTL 300s |
| Audit | `document.download`, `document.preview` |

---

## Encriptação

| Dado | Método |
|------|--------|
| Passwords | Argon2id |
| Campos sensíveis BD | AES-256-GCM (`DATA_ENCRYPTION_KEY`) |
| Documentos | At-rest no Supabase Storage |
| Transit | TLS 1.2+ |
| JWT | HS256 com secrets dedicados |
| Legacy decrypt | crypto-js (🔴 migrar para crypto nativo) |

---

## Auditoria

### Tabela `audit_logs`

| Action | Quando |
|--------|--------|
| `auth.login.success` | Login OK |
| `auth.login.failed` | Credenciais inválidas |
| `auth.login.locked` | Conta bloqueada |
| `auth.password.reset` | Reset concluído |
| `document.download` | Download |
| `document.preview` | Preview |
| `client.hub.view` | Acesso hub fiscal |
| `ai.request` | Pedido IA (futuro) |

**Nunca registar:** passwords, tokens JWT, NIF completo.

### Logs de aplicação

- Winston + Morgan
- Sanitização via `log-sanitization.middleware.js`
- Redacção de UUIDs em produção (frontend)
- Sentry para erros (sem PII)

---

## Multi-tenant — regras absolutas

1. `firm_id` vem **exclusivamente** do JWT validado
2. Todo repository query inclui `.eq('firm_id', firmId)`
3. Recursos com ID na URL são verificados contra o tenant
4. Testes de isolamento no CI (semanal + manual)
5. RLS no Postgres como defesa em profundidade (alvo Fase 7)

---

## Compliance

| Regulamento | Aplicação |
|-------------|-----------|
| **RGPD** (PT) | Consentimentos, DPA, direito ao esquecimento, portabilidade |
| **LGPD** (BR) | Fase 4 — documentos legais + consentimentos |
| **ePrivacy** | Cookie banner, política de cookies |
| **SOC2** | Roadmap Fase 8 |

### Dados pessoais processados

- Nome, email, telefone, NIF/CPF/CNPJ
- Documentos fiscais (facturas, extratos, recibos)
- Mensagens entre escritório e cliente
- Logs de acesso e auditoria

### Retenção

| Dado | Período |
|------|---------|
| Dados de conta | Enquanto activo + 30 dias pós-cancelamento |
| Documentos | Enquanto escritório activo (exportável) |
| Audit logs | 24 meses |
| Login attempts | 30 dias |
| AI requests | 12 meses |

---

## Segurança de IA (futuro)

Ver [AI.md](../ai/AI.md). Resumo:

- LLM nunca no frontend
- PII minimization antes de enviar
- Tenant-scoped RAG
- Audit de toda request
- Opt-out por escritório
- Disclaimer obrigatório

---

## Resposta a incidentes

| Severidade | Tempo de resposta | Acção |
|------------|-------------------|-------|
| P0 — Data breach | < 1h | Isolar, notificar, investigar |
| P1 — Auth bypass | < 4h | Patch + rotate secrets |
| P2 — Vulnerabilidade | < 24h | Patch no próximo deploy |
| P3 — Hardening | < 1 semana | Backlog |

### Rollback

| Camada | Acção |
|--------|-------|
| Frontend | Redeploy commit anterior (Vercel) |
| Backend | Redeploy commit anterior (Render) |
| Migrations | Forward-only — nunca reverter em produção |
| Secrets | Rotate JWT secrets + invalidar sessões |

---

## Checklist de deploy seguro

- [ ] Migrations aplicadas
- [ ] `JWT_*_SECRET` únicos por ambiente
- [ ] `REDIS_URL` configurado
- [ ] `CORS_ORIGINS` exactos
- [ ] `COOKIE_SECURE=true`, `COOKIE_SAMESITE=none`
- [ ] `DATA_ENCRYPTION_KEY` configurado
- [ ] Stripe webhook secret configurado
- [ ] Sentry DSN activo
- [ ] Smoke test passa
- [ ] Tenant isolation test passa
- [ ] Login testado (cookies only, sem sessionStorage)
- [ ] Upload testado (magic bytes)
- [ ] `npm run security:secrets` aprovado antes do push

---

## Riscos residuais

| Prioridade | Risco | Mitigação actual | Acção |
|------------|-------|------------------|-------|
| Alta | RLS bypassada (service role) | App-level scoping + tests | JWT Supabase + RLS (Fase 7) |
| Alta | Sem WAF edge | Rate limit app-level | Cloudflare WAF (Fase 7) |
| Média | CSP unsafe-inline | Scripts restritos | Nonce-based CSP (futuro) |
| Média | crypto-js legacy | Poucos usos | Migrar para crypto nativo (Fase 1) |
| Baixa | `.env.example` ausente | Docs listam vars | Versionar (Fase 3) |

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](../engineering/ARCHITECTURE.md) | Camadas de segurança |
| [API.md](../engineering/API.md) | Auth, CSRF, rate limit |
| [DATABASE.md](../engineering/DATABASE.md) | RLS, audit, retention |
| [AI.md](../ai/AI.md) | Segurança de IA |
| [TENANT_ISOLATION_REPORT.md](./TENANT_ISOLATION_REPORT.md) | Relatório de testes |
