# Login com Google (SSO) — TegLion

O TegLion **não usa Supabase Auth** para login. A autenticação é custom no backend (`firm_users` + JWT em cookies). O Google SSO passa pelo **backend Express**, não pelo painel Authentication do Supabase.

---

## Onde **não** colocar as chaves

| Local | Usar para Google SSO? |
|-------|------------------------|
| Supabase → Authentication → Providers → Google | **Não** |
| Supabase → Edge Functions (secrets) | **Não** (a menos que cries uma função própria — não é o fluxo actual) |
| Frontend `.env` (`VITE_*`) | **Não** — o secret nunca vai para o browser |

Colocar o Client ID/Secret no Supabase **não activa** o botão «Entrar com Google» do TegLion e pode gerar confusão com credenciais erradas.

---

## Onde configurar (correcto)

### 1. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**
2. Criar **OAuth 2.0 Client ID** → tipo **Web application**
3. **Authorized JavaScript origins** (origens JavaScript autorizadas):

| Ambiente | URI |
|----------|-----|
| Produção | `https://teglion.com` |
| Produção | `https://www.teglion.com` |
| Local (frontend) | `http://localhost:3000` |

4. **Authorized redirect URIs** — tem de coincidir **exactamente** com o callback do backend:

| Ambiente | Redirect URI |
|----------|----------------|
| Produção (recomendado) | `https://teglion.com/api/auth/google/callback` |
| Produção (www) | `https://www.teglion.com/api/auth/google/callback` |
| Produção (API directa) | `https://teglion.onrender.com/api/auth/google/callback` |
| Local | `http://localhost:8001/api/auth/google/callback` |
| Staging | `https://teglion-api-staging.onrender.com/api/auth/google/callback` |

> Regista **teglion.com** e **www.teglion.com** no Google Console. O proxy Vercel `/api/*` → Render não recebe CSP do frontend (evita bloquear cold start).

5. Copiar **Client ID** e **Client Secret**

Opcional: OAuth consent screen → adicionar domínios `teglion.com` e emails de teste enquanto a app estiver em «Testing».

### 2. Backend (Render ou `.env` local)

Variáveis no serviço **API** (Render → Environment):

```env
GOOGLE_OAUTH_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_OAUTH_REDIRECT_URI=https://teglion.com/api/auth/google/callback
COOKIE_DOMAIN=.teglion.com
FRONTEND_URL=https://teglion.com
PUBLIC_API_URL=https://teglion.com
```

Se `GOOGLE_OAUTH_REDIRECT_URI` estiver vazio, o backend infere a partir de `FRONTEND_URL` — em produção define explicitamente. **503 em `/api/auth/google`** = credenciais Google em falta no Render (`SSO_DISABLED`).

Referência: [`backend/.env.example`](../../backend/.env.example)

### 3. Supabase (só base de dados)

O Supabase guarda utilizadores em `firm_users` depois do callback Google. Só precisas de:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Não** precisas de activar o provider Google no Supabase Auth.

---

## Fluxo técnico

**Entrar (conta existente):**
```
Browser → GET /api/auth/google?intent=login
       → Google → GET /api/auth/google/callback
       → loginFirmBySso → cookies JWT → /app/firm/dashboard
```

**Criar escritório (conta nova):**
```
Browser → GET /api/auth/google?intent=register&countryCode=PT
       → Google → callback
       → se e-mail já existe: login
       → se não existe: cookie pendente → /auth/firm/register/google
       → POST /api/auth/register-firm-google (nome escritório + termos legais)
       → cookies JWT → dashboard
```

Código: `backend/src/modules/auth/google-sso.controller.js`, `google-sso.service.js`

---

## Verificar se está activo

```bash
curl -s https://SUA-API/api/auth/sso/status
# { "google": true, "providers": ["google"] }
```

Se `google: false`, faltam `GOOGLE_OAUTH_CLIENT_ID` ou `GOOGLE_OAUTH_CLIENT_SECRET` no backend.

Endpoint de saúde (admin): integrações Google em `integrations-health`.

---

## Erros comuns

| Sintoma | Causa provável |
|---------|----------------|
| `redirect_uri_mismatch` | URI no Google Cloud ≠ `GOOGLE_OAUTH_REDIRECT_URI` |
| `sso_disabled` | Variáveis em falta no Render |
| `invalid_state` | Cookies bloqueados ou domínio/cross-site mal configurado (`COOKIE_SAMESITE`, `COOKIE_SECURE`) |
| `account_not_found` | Email Google não corresponde a um `firm_user` já registado no escritório |
| Funciona em local, falha em prod | Redirect URI de produção não adicionado no Google Cloud |

---

## Staging vs produção

Usa **dois OAuth clients** no Google Cloud (ou o mesmo client com **vários** redirect URIs listados):

- Um redirect para API de staging
- Um redirect para API de produção

Secrets diferentes em cada serviço Render — ver [BRANCHING.md](./BRANCHING.md).
