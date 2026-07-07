# Stripe + Sentry — configuração TegLion

## 1. Stripe Dashboard

### A. Conta e modo

1. [dashboard.stripe.com](https://dashboard.stripe.com) → activar conta (dados fiscais PT).
2. Em desenvolvimento use **Test mode** (interruptor no canto superior).
3. Em produção: **Live mode** + chaves `sk_live_...` e `pk_live_...`.

### B. Produto e preço (29,99 €/mês)

1. **Product catalog** → **+ Add product**
2. Nome: `TegLion — Plano Escritório`
3. Preço: **Recurring** → **29,99 EUR** → **Monthly**
4. Copie o **Price ID** (`price_...`) → variável `STRIPE_PRICE_ID_EUR` no Render.

Opcional: **Settings → Payment methods** → activar Multibanco, MB WAY, cartão (Portugal).

### C. API Keys

1. **Developers → API keys**
2. **Secret key** → `STRIPE_SECRET_KEY` no Render (nunca no frontend).
3. A chave com nome **teglion-production** no painel é só um rótulo — o valor começa por `sk_live_` ou `sk_test_`.

### D. Webhook

1. **Developers → Webhooks** → **+ Add endpoint**
2. **Endpoint URL (produção):**
   ```
   https://teglionapp.onrender.com/api/public/stripe/webhook
   ```
3. Eventos a subscrever:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Depois de criar, abra o endpoint → **Signing secret** (`whsec_...`) → `STRIPE_WEBHOOK_SECRET` no Render.

### E. Customer portal (opcional mas recomendado)

1. **Settings → Billing → Customer portal**
2. Activar: cancelar subscrição, actualizar método de pagamento, ver facturas.

### F. Variáveis no Render (backend)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_EUR=price_...
FRONTEND_URL=https://teglion.com
```

### G. Fluxo no produto

| Fase | Comportamento |
|------|----------------|
| Registo | `TRIAL` + 14 dias (`trial_ends_at`) |
| Durante trial | Acesso total |
| Trial expirado | API bloqueia → redirect `/app/firm/billing` |
| Checkout Stripe | Webhook → `ACTIVE` + `stripe_subscription_id` |
| Pagamento falhou | `SUSPENDED` |

---

## 2. Sentry

### A. Criar projecto

1. [sentry.io](https://sentry.io) → **Create project**
2. Platform: **Node** (backend) e **React** (frontend) — ou um projecto cada.
3. Copie o **DSN** (`https://...@....ingest.sentry.io/...`).

### B. Variáveis

| Onde | Variável |
|------|----------|
| Render | `SENTRY_DSN` |
| Vercel | `VITE_SENTRY_DSN` |

### C. Instalar dependências (local / CI)

```bash
cd backend && npm install @sentry/node
cd frontend && npm install @sentry/react
```

---

## 3. Supabase — migration Stripe

```bash
cd supabase && supabase db push
```

Ou executar SQL em `supabase/migrations/20260828000000_firm_stripe_billing.sql`.

---

## 4. Testar em modo test

1. Render/Vercel com chaves `sk_test_` e `whsec_` de teste.
2. Cartão teste Stripe: `4242 4242 4242 4242`.
3. Registar escritório → esperar trial (ou alterar `trial_ends_at` no Supabase para ontem).
4. Abrir **Plano e subscrição** → **Activar plano (Stripe)**.
5. Verificar no Supabase: `firms.status = ACTIVE`.

---

## 5. Checklist produção

- [ ] Produto + preço EUR no Stripe Live
- [ ] Webhook aponta para `https://teglionapp.onrender.com/api/public/stripe/webhook`
- [ ] `STRIPE_*` no Render
- [ ] `FRONTEND_URL=https://teglion.com`
- [ ] Migration Supabase aplicada
- [ ] Sentry DSN em Render + Vercel
- [ ] Teste checkout com cartão real (valor mínimo) antes de vender
