# Ambiente local — TegLion

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8001/api |
| Supabase | Cloud (não corre em local) |

O Vite faz proxy de `/api` → `http://localhost:8001`.

---

## 1. Backend

Copiar `backend/.env.example` para `backend/.env.local` e preencher os valores.

```bash
cd backend && npm install && npm run dev
```

## 2. Frontend

```bash
cd frontend && npm install && npm run dev
```

## 3. Migrations Supabase

**Projeto existente:** `supabase db push`

**BD nova** — SQL Editor, por ordem:

1. `supabase/schema.sql` → `tables.sql` → `indexes.sql` → `rls.sql` → `policies.sql`
2. `supabase/migrations/*.sql`
3. `supabase db push`

Validar storage: `cd backend && npm run storage:validate`

---

## 4. Smoke test

```bash
cd backend && npm run smoke:pilot
# Com API local:
API_BASE=http://localhost:8001 npm run smoke:pilot
```

---

## 5. Testes

```bash
cd frontend && npx tsc --noEmit && npm run build
cd backend && npm run test:unit
```

---

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| CORS / API HTML | Arrancar backend na porta 8001 |
| 429 / logout | Deploy backend+frontend com fixes de rate limit; evitar muitas abas |
| Email com link errado | `FRONTEND_URL=http://localhost:3000` em `.env.local` |
| Upload falha | Aplicar migration storage (`20260703000000`) |

Deploy produção: [`DEPLOY_PRODUCTION.md`](./DEPLOY_PRODUCTION.md) · Staging: [`DEPLOY_STAGING.md`](./DEPLOY_STAGING.md)
