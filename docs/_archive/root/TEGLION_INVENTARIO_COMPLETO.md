# TegLion — Inventário Completo

**Data:** 17 Jul 2026  
**Âmbito:** levantamento do estado actual do repositório + investigação do bug de funcionários/e-mail/reset  
**Fontes principais:** `docs/operations/STATUS.md`, `docs/product/MODULES.md`, `docs/operations/CTO_PRODUCTION_AUDIT_2026-07.md`, código em produção (Supabase), correções aplicadas nesta sessão

---

## 1. Estrutura do projeto

### Pastas principais

| Pasta | Função |
|-------|--------|
| `frontend/` | SPA React 19 + Vite + TypeScript |
| `backend/` | API Express (monólito modular) |
| `supabase/` | Migrations SQL, schema, RLS |
| `docs/` | Documentação por domínio (product, engineering, operations, …) |
| `tools/` | CI / checks de qualidade |
| `.github/` | Workflows CI |
| raiz | `README.md`, `STRUCTURE.md`, `package.json` (workspace) |

### Apps / frontend / backend

- **Frontend:** `frontend/src/features/` (auth, firm, client, marketing, blog, legal) + `shared/` + `infrastructure/`
- **Backend:** `backend/src/modules/` (auth, firm, client, documents, tasks, obligations, billing, …) → `routes` → `controllers` → `services` → `repositories`
- **BD:** Supabase PostgreSQL (`firm_id` multi-tenant) + Storage
- **Auth:** **custom** (`firm_users` / `clients` + JWT cookies). **Não** usa Supabase Auth / `inviteUserByEmail`

### Configurações importantes

| Config | Onde |
|--------|------|
| Env backend | `backend/src/config/env.js` — `FRONTEND_URL`, `BREVO_API_KEY`, `FROM_EMAIL`, Supabase, JWT, Stripe, Redis |
| Env frontend | `VITE_API_BASE_URL` (Vercel) |
| Deploy | Vercel (FE `teglion.com`) + Render (BE `teglionapp.onrender.com`) |
| CORS / cookies | `CORS_ORIGINS`, `COOKIE_SAMESITE=none` em produção |
| Product mode | `PRODUCT_MODE=contabil` |

---

## 2. Tecnologias utilizadas

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, Vite, TypeScript, TanStack Query, React Hook Form, Zod, Tailwind/shadcn |
| Backend | Node.js, Express |
| Banco | Supabase PostgreSQL + RLS |
| Ficheiros | Supabase Storage |
| Autenticação | JWT httpOnly cookies + refresh sessions + CSRF (custom; não Supabase Auth) |
| Email | Brevo REST API (`BREVO_API_KEY`) — SMTP env vars existem mas **não são usadas** |
| SMS | Brevo SMS (opcional) |
| Pagamentos | Stripe |
| Cache / rate limit | Redis (Render) |
| Hospedagem | Vercel + Render |
| SSO | Google OAuth |
| Push | Web Push (VAPID) |

---

## 3. Documentações já existentes

| Documento | Status |
|-----------|--------|
| `README.md` | Existe |
| `STRUCTURE.md` | Existe |
| `LICENSE` | Existe |
| `docs/product/README.md` | Existe (índice curto) |
| `docs/product/VISION.md` | Existe |
| `docs/product/PRODUCT.md` | Existe |
| `docs/product/MODULES.md` | Existe — fonte forte de maturidade |
| `docs/product/ROADMAP.md` | Existe |
| `docs/product/ROADMAP_BACKLOG.md` | Existe — overlap parcial com ROADMAP |
| `docs/product/CHANGELOG.md` | Existe |
| `docs/product/SCALE_100K_1M_CHECKLIST.md` | Existe (visão escala) |
| `docs/engineering/README.md` | Existe |
| `docs/engineering/ARCHITECTURE.md` | Existe |
| `docs/engineering/ARCHITECTURE_REORGANIZATION.md` | Existe |
| `docs/engineering/DATABASE.md` | Existe |
| `docs/engineering/API.md` | Existe |
| `docs/engineering/CODING_STANDARDS.md` | Existe |
| `docs/operations/README.md` | Existe |
| `docs/operations/STATUS.md` | Existe — fonte de verdade operacional |
| `docs/operations/CRONOGRAMA.md` | Existe |
| `docs/operations/DEPLOY_PRODUCTION.md` | Existe |
| `docs/operations/DEPLOY_STAGING.md` | Existe |
| `docs/operations/GO_PRODUCTION.md` | Existe |
| `docs/operations/GO_LIVE_CHECKLIST.md` | Existe |
| `docs/operations/DEV_LOCAL.md` | Existe |
| `docs/operations/BRANCHING.md` | Existe |
| `docs/operations/STRIPE_SETUP.md` | Existe |
| `docs/operations/FREE_PLAN_SETUP.md` | Existe |
| `docs/operations/GOOGLE_SSO_SETUP.md` | Existe |
| `docs/operations/REDIS_RENDER_SETUP.md` | Existe |
| `docs/operations/STORAGE.md` | Existe |
| `docs/operations/INCIDENT_RUNBOOK.md` | Existe |
| `docs/operations/PILOT_ROADMAP.md` | Existe |
| `docs/operations/AUDIT_PRODU.md` | Existe — backlog curto; overlap com CTO audit |
| `docs/operations/CTO_PRODUCTION_AUDIT_2026-07.md` | Existe — auditoria CTO Jul 2026 |
| `docs/operations/SPRINT_0_9_GESTAO_EQUIPAS.md` | Existe — spec gestão de equipas |
| `docs/operations/SPRINT_0_9_TICKETS.md` | Existe |
| `docs/operations/EXECUCAO_ROLES_TELAS.md` | Existe |
| `docs/security/README.md` | Existe |
| `docs/security/SECURITY.md` | Existe — **parcialmente desatualizado** (TTL reset 1h vs código 15m) |
| `docs/security/TENANT_ISOLATION_REPORT.md` | Existe |
| `docs/design/README.md` | Existe |
| `docs/design/DESIGN_SYSTEM.md` | Existe |
| `docs/design/UI.md` | Existe |
| `docs/ai/README.md` | Existe |
| `docs/ai/AI.md` | Existe (planeado / visão) |
| `docs/international/README.md` | Existe |
| `docs/international/MULTI_COUNTRY.md` | Existe |
| `docs/content/README.md` | Existe |
| `docs/content/LEGAL.md` | Existe |
| `docs/content/BLOG_AUTHORING.md` | Existe |
| `docs/qa/README.md` | Existe |
| `docs/qa/visual-baseline/README.md` | Existe |
| `docs/CLIENTE_PILOTO/ROADMAP.md` | Existe (curto) |
| `docs/CLIENTE_PILOTO/BACKLOG.md` | Existe |
| `docs/CLIENTE_PILOTO/BUGS_ENCONTRADOS.md` | Existe |
| `docs/CLIENTE_PILOTO/PEDIDOS_CONTADORA.md` | Existe |
| `docs/CLIENTE_PILOTO/CHANGELOG.md` | Existe |
| `docs/BACKEND_JAVA_BLUEPRINT.md` | Existe — blueprint futuro Java; **não é stack actual** |
| `backend/src/modules/README.md` | Existe |
| `backend/src/modules/auth/google/README.md` | Existe |
| `backend/src/modules/client/portal/README.md` | Existe |
| `frontend/src/README.md` | Existe |
| `tools/README.md` | Existe |

### Notas de duplicação / desactualização

- `ROADMAP.md` ↔ `ROADMAP_BACKLOG.md` ↔ `CLIENTE_PILOTO/ROADMAP.md`: sobreposição de intenção, âmbitos diferentes.
- `AUDIT_PRODU.md` ↔ `CTO_PRODUCTION_AUDIT_2026-07.md`: o CTO audit é a versão completa.
- `SECURITY.md` TTL de reset **desatualizado** face ao código (15 min).
- Não há pasta de ADRs formais; decisões estão espalhadas por STATUS / ARCHITECTURE / CRONOGRAMA.

---

## 4. Funcionalidades implementadas (produção / piloto)

- Registo e login de escritório (email + Google SSO)
- Login e convite de cliente (portal)
- Gestão de clientes / hub
- Pedidos de documentos, upload, validação magic bytes, storage
- Tarefas operacionais + obrigações fiscais
- Calendário fiscal PT
- Mensagens escritório ↔ cliente
- Alertas / broadcasts
- Definições do escritório (branding, contacto)
- Gestão de equipa e departamentos (backend + UI)
- Convites de staff (fluxo token + confirmação de e-mail)
- Recover / reset password (tokens custom em `password_reset_tokens`)
- Billing Stripe (código; live a validar)
- Landing, pricing, security page, blog SEO
- Páginas legais (termos, privacidade, DPA)
- Multi-tenant por `firm_id` + RLS + service role no backend
- Rate limit, CSRF, audit logs, lockout de login
- Smoke tests / CI build

---

## 5. Funcionalidades parcialmente implementadas

- Billing UX / trial / consistência Stripe live vs test
- Agenda / consultorias (funcional, uso secundário)
- Serviços / orçamentos
- Automações (backend + UI limitada)
- Notificações / push (parcial)
- Centro de notificações unificado
- Arquivo do cliente (candidato a fusão com Documentos)
- Notícias do portal
- Booking
- Integração AT (só deep-links)
- i18n (pt-PT real; pt-BR incompleto)
- Acessibilidade (parcial)
- Observabilidade / health de e-mail (melhorado nesta sessão; health público ainda oculto em prod)
- Gestão de equipa na UI para staff com permissões (corrigido nesta sessão: `canManageTeam` deixou de ser só owner)

---

## 6. Funcionalidades planejadas (docs, ainda não produto)

- IA operacional (`docs/ai/AI.md`)
- Escala 100k–1M (filas obrigatórias, SRE, DR/BCP, WAF)
- Multi-país real (BR/ES além de stubs)
- Backend Java (`BACKEND_JAVA_BLUEPRINT.md`) — alternativa futura, não roadmap imediato
- Integrações certificadas AT / ERP / WhatsApp / bancos
- TegLion Academy / Certified Partner
- Filas assíncronas robustas para e-mail/SMS/jobs
- Remoção completa do legado clínico / rotas antigas

---

## 7. Dívida técnica identificada

### Arquitectura / produto

- Auth custom + Brevo: correcto para o desenho actual, mas docs/expectativas por vezes falam como se fosse Supabase Auth
- Soft-fail operacional em integrações (e-mail/SMS/billing) — risco de “parece OK” sem entrega
- Legado de domínio antigo ainda referenciado em middleware/compat

### Código / fluxos frágeis (pré-correção desta sessão)

1. **`canManageTeam` hardcoded a `FIRM_OWNER`** — staff com `USERS_CREATE` não via formulários de criação
2. **Welcome e-mail fire-and-forget** com `.catch(() => {})` + audit mentia `welcomeEmailSent: true`
3. **Password reset** devolvia sucesso genérico mesmo com e-mail skipped/indisponível
4. Recovery bloqueava users `is_active=false` mesmo com password (pós-aceitar convite, pré-confirm)
5. Tokens de invite de staff em plaintext (reset/confirm usam hash)
6. SMTP env vars mortas (só Brevo envia)
7. Cobertura de testes ainda limitada face à superfície do produto

### Segurança

- Isolamento tenant sólido no desenho; continua a exigir disciplina em novas queries
- Views / functions security-definer: seguir checklist Supabase em novas migrations
- JWT `user_metadata` nunca deve ser base de autorização (já alinhado: permissions em BD/override)

---

## 8. Classificação por prioridade

| Prioridade | Critério | Itens |
|------------|----------|--------|
| Crítica | Impede uso | Gate UI `canManageTeam`; e-mails transaccionais silenciosos; reset sem entrega real |
| Alta | Valor imediato piloto | Feedback claro de entrega de e-mail; health Brevo; password hints; billing live estável |
| Média | Experiência | i18n, a11y, unificação arquivo/docs, automações UI |
| Futuro | Escala | Filas, SRE/SLO, multi-país, IA, Java blueprint |

---

## 9. Resumo executivo final

### O que o TegLion já possui de nível profissional

- Monólito modular bem fronteirado, multi-tenant por `firm_id`, auth cookie-only com CSRF/rate-limit/lockout
- Core operacional do escritório + portal cliente utilizável em piloto real
- Documentação operacional e de produto acima da média para um SaaS nesta fase
- Deploy real (Vercel + Render + Supabase) e smoke/CI

### O que ainda falta para um piloto comercial sólido

- E-mail transaccional **observável e falhando fechado** (parcialmente corrigido nesta sessão)
- Gestão de equipa usável por quem tem permissão (corrigido nesta sessão)
- Validação diária com a contadora piloto (criar colaborador → e-mail → login → reset)
- Billing live previsível + checklist go-live sem surpresas

### O que falta para vender em escala

- Filas assíncronas, observabilidade com SLO, WAF, DR/BCP
- Remoção de soft-fails e legado
- Multi-tenant scale (índices, partições, Redis obrigatório multi-instância)
- Onboarding self-serve + suporte + playbooks de incidentes exercitados

### 5 próximos passos mais importantes

1. **Validar em produção** após deploy: staff com permissões cria colaborador; welcome/reset chegam via Brevo; UI mostra falha se e-mail falhar
2. **Confirmar `BREVO_API_KEY` + `FROM_EMAIL` verificados** no Render e domínio remetente
3. **Smoke manual piloto** do fluxo equipa + recover password (firm e client)
4. Fechar **billing live** e UX de trial/expiração
5. Introduzir **fila** para e-mails críticos (invite, welcome, reset) com retry e dead-letter

---

## Anexo A — Investigação do bug (funcionários / e-mail / reset)

### Sintomas reportados

1. Contadora não consegue cadastrar funcionários
2. Funcionário não recebe e-mail de boas-vindas
3. Não é possível redefinir a senha

### Arquitectura real do fluxo (não é Supabase Auth)

```
UI Definições → Equipa
  → POST /api/contabil/team  (DIRECT)  ou  /team/invites
  → firm_users (+ firm_member_invites)
  → Brevo sendEmail (FRONTEND_URL nos links)
  → /auth/firm/team-invite/:token → accept → email confirm
  → /auth/recover → password_reset_tokens → Brevo → /reset-password
```

### Evidência em produção (Supabase `zanjbscfumxtdkglmpfb`)

- Criação de membro **funciona no BD** (ex.: Cátia Marques, 15 Jul 2026, `welcomeEmailRequested` marcado no audit antigo como enviado)
- Contadora Maynara tem override com `USERS_CREATE` + `FIRM_INVITES_MANAGE`
- Convites históricos com `emailSent: true` (API Brevo aceitou)
- Tokens de reset recentes quase inexistentes (último uso relevante 06 Jul)

### Causas raiz

| # | Causa | Impacto |
|---|--------|---------|
| 1 | `capabilities.canManageTeam = (role === FIRM_OWNER)` | Staff/contadora com permissões **não vê** criar/convidar |
| 2 | Welcome e-mail `void … .catch(() => {})` + audit falso | Conta criada, e-mail pode falhar sem aviso |
| 3 | Reset: `sendEmail` skip / falha mal reportada ao FE | Utilizador vê “enviámos o link” ou erro genérico sem recuperação útil |
| 4 | Recovery exige `is_active` | Pós-aceitar convite / pré-confirm: sem login e sem reset |

### Correções aplicadas nesta sessão

- `firm-settings.service.js`: `canManageTeam` baseado em RBAC real
- `team.service.js` + controller + FE: welcome e-mail awaited + status honesto na UI
- `contabil-auth.service.js`: recovery para ACCEPTED inactivo; falha fechada se e-mail skip/fail; invalida token
- `authApi.recover`: preserva status/code HTTP
- `team-invites.service.js`: confirmation e-mail sem swallow silencioso
- `integrations-health.js`: probe Brevo
- UI: hints de password + mensagens de falha de e-mail

### Verificação operacional recomendada (pós-deploy)

1. Login como staff com `USERS_CREATE` → Definições → Equipa → formulários visíveis
2. Criar colaborador com “enviar boas-vindas” → toast de sucesso **ou** aviso se Brevo falhar
3. Recover password com e-mail válido → mensagem de sucesso só se Brevo entregar; 503 se indisponível
4. Render: confirmar `BREVO_API_KEY`, `FROM_EMAIL`, `FRONTEND_URL=https://teglion.com`
