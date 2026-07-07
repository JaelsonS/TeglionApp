# TegLion — API

**Documento oficial · Última actualização: Julho 2026**

Contrato HTTP da API TegLion. Descreve áreas, convenções e endpoints. Para detalhe de implementação, ver código em `backend/src/routes/`.

---

## Base URL

| Ambiente | URL |
|----------|-----|
| Produção | `https://api.teglion.com` |
| Staging | `https://teglion-api-staging.onrender.com` |
| Local | `http://localhost:8001` |

**Prefixo actual:** `/api`  
**Prefixo alvo (Fase 2):** `/api/v1` (com deprecation de `/api`)

---

## Convenções

### Autenticação

| Método | Detalhe |
|--------|---------|
| **Cookies httpOnly** | `accessToken` + `refreshToken` — método principal |
| **CSRF** | Cookie `csrfToken` + header `X-CSRF-Token` em mutações |
| **Bearer** | Só se `ALLOW_BEARER_AUTH=true` — não recomendado em produção |
| **Refresh** | `POST /api/auth/refresh` — automático pelo frontend |

### Headers obrigatórios (mutações)

```
Content-Type: application/json
X-CSRF-Token: {csrfToken}
Accept-Language: pt-PT
X-User-Language: pt-PT
```

### Formato de resposta

**Sucesso:**
```json
{
  "data": { ... },
  "meta": { "total": 42, "page": 1 }
}
```

**Erro:**
```json
{
  "error": {
    "message": "Mensagem legível",
    "code": "VALIDATION_ERROR",
    "status": 400,
    "details": []
  }
}
```

### Paginação

```
GET /api/contabil/clients?limit=20&offset=0
```

| Param | Default | Max |
|-------|---------|-----|
| `limit` | 20 | 100 |
| `offset` | 0 | — |

### Tenant scoping

- `firmId` vem do JWT — **nunca** do body ou query
- `clientId` em rotas de portal vem do JWT
- Recursos com ID na URL são validados contra o tenant

### Rate limiting

| Contexto | Limite |
|----------|--------|
| Global | 100 req/15min por IP |
| Autenticado | 600 req/15min por user |
| Auth (login) | 20 req/15min por IP |
| Registo | 5 req/15min por IP |
| Newsletter | 5 req/hora por IP |

---

## Áreas da API

```
/api
├── /auth          — Autenticação (público + autenticado)
├── /public        — Endpoints públicos (sem auth)
├── /contabil      — API do escritório (auth + RBAC)
├── /client-portal — API do portal cliente (auth)
└── /patient-portal — Alias legacy → client-portal
```

---

## `/api/auth` — Autenticação

### Públicos

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/login-firm` | Login escritório |
| POST | `/login-client` | Login cliente (aceita `firmSlug`) |
| POST | `/register-client-invite` | Registo via convite |
| POST | `/refresh` | Renovar access token |
| POST | `/logout` | Terminar sessão |
| POST | `/recover` | Pedir reset de password |
| POST | `/validate-reset-token` | Validar token de reset |
| POST | `/reset` | Definir nova password |
| GET | `/sso/status` | Estado Google SSO |
| GET | `/google` | Iniciar OAuth Google |
| GET | `/google/callback` | Callback OAuth |

### Autenticados

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/me` | Utilizador actual + tenant |
| POST | `/complete-onboarding` | Completar onboarding |

---

## `/api/public` — Público

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/health/integrations` | Estado integrações (Brevo, Stripe, Storage) |
| GET | `/legal/versions` | Versões dos documentos legais |
| GET | `/postal-lookup?code=` | Código postal PT |
| GET | `/client-invite/:token` | Validar convite |
| GET | `/firm-branding?slug=` | Branding público do escritório |
| POST | `/blog/newsletter` | Subscrever newsletter |

### Webhook (montado em app.js)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/public/stripe/webhook` | Stripe events (raw body) |

---

## `/api/contabil` — Escritório

Requer: auth + `requireActiveFirm` + permissões RBAC.

### Registo (pré-auth)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/auth/register-firm` | Registo de escritório |

### Dashboard e firm

| Método | Path | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/dashboard` | CLINIC_READ | KPIs do escritório |
| GET | `/firm/settings` | CLINIC_READ | Definições |
| PATCH | `/firm/settings` | CLINIC_UPDATE | Actualizar definições |
| POST | `/firm/logo` | CLINIC_UPDATE | Upload logo |
| GET | `/firm/team` | USERS_READ | Listar equipa |
| POST | `/firm/team` | USERS_CREATE | Adicionar membro |

### Clientes

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/clients` | Listar clientes |
| POST | `/clients` | Criar cliente |
| GET | `/clients/:id` | Detalhe |
| PATCH | `/clients/:id` | Actualizar |
| GET | `/clients/:id/hub` | Hub do cliente (fiscal + operacional) |
| POST | `/clients/:id/invites` | Enviar convite portal |

### Documentos

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/documents` | Listar documentos |
| GET | `/documents/:id` | Detalhe |
| GET | `/documents/:id/download` | Download (signed URL) |
| GET | `/documents/:id/preview` | Preview |
| PATCH | `/documents/:id/validate` | Aprovar/rejeitar |
| GET | `/inbox` | Inbox de documentos |
| GET | `/document-requests` | Pedidos de documentos |
| POST | `/document-requests` | Criar pedido |

### Tarefas e obrigações

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/tasks/workspace` | Workspace de tarefas |
| POST | `/tasks` | Criar tarefa |
| PATCH | `/tasks/:id` | Actualizar tarefa |
| GET | `/obligations` | Listar obrigações |
| POST | `/obligations` | Criar obrigação |
| PATCH | `/obligations/:id` | Actualizar |
| GET | `/obligation-templates` | Templates |
| GET | `/fiscal-calendar` | Calendário fiscal nacional |
| GET | `/fiscal-calendar/notes` | Notas do calendário |

### Comunicação

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/messages` | Listar conversas |
| GET | `/messages/:clientId` | Mensagens com cliente |
| POST | `/messages/:clientId` | Enviar mensagem |
| GET | `/messages/unread-summary` | Contagem não lidas |
| GET | `/broadcasts` | Alertas/comunicados |
| POST | `/broadcasts` | Criar alerta |
| GET | `/news` | Notícias para clientes |
| POST | `/news` | Criar notícia |

### Operações

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/consultations` | Consultorias/agenda |
| POST | `/consultations` | Agendar |
| GET | `/service-requests` | Pedidos de serviço |
| POST | `/service-requests` | Criar pedido |
| GET | `/sms-logs` | Logs SMS ⚠️ sem UI frontend |
| GET | `/notifications` | Notificações in-app |

### Billing

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/billing/status` | Estado subscrição |
| POST | `/billing/checkout` | Iniciar checkout Stripe |
| POST | `/billing/portal` | Portal de gestão Stripe |

### Automações e integrações

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/automations/rules` | Regras de automação |
| POST | `/automations/rules` | Criar regra |
| POST | `/automations/run-all` | Executar (cron) |
| GET | `/integrations/at/status` | Estado integração AT |
| GET | `/integrations/at/links` | Deep-links AT |

### Live e push

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/live/events` | Long-poll eventos |
| GET | `/push/vapid` | Chave pública VAPID |
| POST | `/push/subscribe` | Subscrever push |

---

## `/api/client-portal` — Portal cliente

Requer: auth (role CLIENT/PATIENT).

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/me/contabil/hub` | Dashboard hub |
| GET | `/me/contabil/dashboard` | Dashboard dados |
| GET | `/document-requests` | Pedidos pendentes |
| GET | `/documents` | Documentos |
| POST | `/documents/upload` | Upload ficheiro |
| GET | `/documents/:id/download` | Download |
| GET | `/obligations` | Obrigações |
| PATCH | `/obligations/:id/mark-paid` | Marcar como pago |
| GET | `/tasks` | Tarefas |
| POST | `/tasks/:id/submit` | Submeter tarefa |
| GET | `/messages` | Mensagens |
| POST | `/messages` | Enviar mensagem |
| GET | `/messages/unread-count` | Não lidas |
| GET | `/broadcasts` | Alertas |
| GET | `/news` | Notícias |
| GET | `/booking/services` | Serviços disponíveis |
| GET | `/booking/slots` | Slots disponíveis |
| POST | `/booking/book` | Marcar consulta |
| GET | `/service-requests` | Pedidos de serviço |
| POST | `/service-requests` | Criar pedido |
| GET | `/live/events` | Long-poll |
| POST | `/push/subscribe` | Push |

---

## `/api/v1/ai` — IA (futuro, Fase 5)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/ai/documents/classify` | Classificar documento |
| POST | `/ai/documents/summarize` | Resumir documento |
| POST | `/ai/communications/generate-request` | Gerar pedido de docs |
| POST | `/ai/communications/generate-email` | Gerar email |
| POST | `/ai/copilot/ask` | Pergunta ao assistente |
| GET | `/ai/usage` | Consumo IA do escritório |

---

## Códigos de erro

| HTTP | Code | Significado |
|------|------|-------------|
| 400 | `VALIDATION_ERROR` | Input inválido |
| 401 | `UNAUTHORIZED` | Não autenticado |
| 403 | `FORBIDDEN` | Sem permissão |
| 403 | `FIRM_SUSPENDED` | Escritório suspenso/trial expirado |
| 403 | `ACCOUNT_LOCKED` | Conta bloqueada (brute force) |
| 404 | `NOT_FOUND` | Recurso não encontrado |
| 409 | `CONFLICT` | Duplicado (ex: email) |
| 413 | `FILE_TOO_LARGE` | Upload excede limite |
| 415 | `UNSUPPORTED_MEDIA` | Tipo de ficheiro não permitido |
| 429 | `RATE_LIMITED` | Demasiados pedidos |
| 500 | `INTERNAL_ERROR` | Erro interno |
| 503 | `STRIPE_NOT_CONFIGURED` | Stripe não configurado |

---

## Upload de ficheiros

```
POST /api/client-portal/documents/upload
Content-Type: multipart/form-data

Fields:
  file: (binary) — obrigatório
  documentRequestId: (uuid) — opcional
  title: (string) — opcional
```

**Limites:**
- Tamanho máximo: 25MB (configurável via `MAX_FILE_SIZE_MB`)
- Tipos: PDF, JPEG, PNG, GIF, WebP, DOC, DOCX, XLS, XLSX, ZIP
- Validação: MIME whitelist + magic bytes

---

## Webhooks (futuro, Fase 6)

```
POST /api/v1/webhooks/{firmId}
X-TegLion-Signature: sha256=...
```

Eventos: `document.uploaded`, `obligation.overdue`, `client.created`, `message.received`.

---

## Versionamento

| Versão | Estado | Notas |
|--------|--------|-------|
| `/api` (actual) | Activo | Sem versão no path |
| `/api/v1` | Alvo Fase 2 | Com deprecation header em `/api` |
| `/api/v2` | Futuro | Breaking changes |

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Camadas e fluxo |
| [SECURITY.md](../security/SECURITY.md) | Auth, CSRF, rate limit |
| [MODULES.md](../product/MODULES.md) | Módulos por área |
| [AI.md](../ai/AI.md) | Endpoints de IA (futuro) |
