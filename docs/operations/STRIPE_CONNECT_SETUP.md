# Stripe Connect — LIVE (dinheiro real)

Pagamentos dos **clientes do escritório** → Connected Account Express.  
**Separado** do Billing SaaS ([STRIPE_SETUP.md](./STRIPE_SETUP.md)).

| Fluxo | Quem paga | Quem recebe | Webhook |
|-------|-----------|-------------|---------|
| **Billing** | Escritório → Teglion | Teglion | `/api/public/stripe/webhook` |
| **Connect** | Cliente → Escritório | Conta Stripe do escritório | `/api/public/stripe/connect/webhook` |

A Teglion **não custodia** dinheiro. Processamento: Stripe. O escritório aceita a política em Definições → Pagamentos (registo com IP, hora, hash do texto).

---

## Activação LIVE (produção)

O código usa a mesma `STRIPE_SECRET_KEY` da plataforma. Em produção deve ser **`sk_live_…`**. Contas Express criadas com `sk_test_` **não servem** em live — o dono tem de voltar a ligar o Connect em Definições.

### 1. Stripe Dashboard — modo **Live** (toggle Test off)

1. **Connect → Settings**: perfil da plataforma, branding, website, suporte, país PT.
2. Completar requisitos de plataforma Connect (Stripe pode pedir informação da Teglion como platform).
3. **Developers → Webhooks → Add endpoint** (Live)
   - URL: `https://<API_PRODUÇÃO>/api/public/stripe/connect/webhook`
   - Listen to: **Events on Connected accounts**
   - Eventos:
     - `account.updated`
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `charge.refunded`
4. Copiar **Signing secret** (`whsec_…`) → `STRIPE_CONNECT_WEBHOOK_SECRET` no Render.
5. **Não** reutilizar o webhook de Billing para eventos Connect.

### 2. Variáveis no Render (backend produção)

| Variável | Valor live |
|----------|------------|
| `STRIPE_SECRET_KEY` | `sk_live_…` (plataforma) |
| `STRIPE_CONNECT_ENABLED` | `true` |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `whsec_…` do endpoint Connect **live** |
| `STRIPE_WEBHOOK_SECRET` | Continua o secret do webhook **Billing** live (outro endpoint) |
| `STRIPE_PRICE_ID_EUR_MONTHLY` / `YEARLY` | Price IDs **live** do plano Teglion |
| `FRONTEND_URL` | URL canónica da app (ex. `https://app.teglion.com`) |

Depois de gravar: **redeploy** do backend.

### 3. Base de dados

Aplicar no Supabase **produção**:

- `20260925000000_firm_stripe_connect.sql`
- `20260926000000_firm_payments_booking_hold.sql`

### 4. Escritório (piloto / Liliane)

1. Definições → **Pagamentos** → ler política → aceitar → Ligar Stripe Connect (**KYC live**).
2. Esperar `charges_enabled` (webhook `account.updated`).
3. Serviço público: agendamento ON + **Pagamento obrigatório** + preço > 0.
4. Fazer **um pagamento real pequeno** (ex. 1,00 €) no link público e confirmar:
   - webhook → consulta `SCHEDULED`
   - dinheiro na Express do escritório
   - Google Calendar (se ligado)

### 5. Checklist GO Connect live

- [ ] Migrations Connect + payments aplicadas em produção
- [ ] `sk_live_` no Render (não `sk_test_`)
- [ ] `STRIPE_CONNECT_ENABLED=true`
- [ ] Webhook Connect live a receber eventos (Dashboard → Webhooks → recent deliveries)
- [ ] Billing SaaS (mensalidade Teglion) continua com Price IDs live e o **seu** webhook
- [ ] Dono completou onboarding Express live + aceite legal gravado
- [ ] 1º pagamento real de serviço OK
- [ ] Refunds: Dashboard Express do escritório (API refund depois)

---

## Fluxo produto (já no código)

1. Hold `PENDING_PAYMENT` 30 min + Checkout Session (direct charge, fee Teglion = 0).
2. `checkout.session.completed` → `firm_payments.paid` + `SCHEDULED` → Calendar.
3. Expiração / `checkout.session.expired` → liberta horário.
4. Página `/:firmSlug/booking/return` = UX; **paid só via webhook**.

---

## Segurança

- Secrets só no Render — nunca no Git.
- Webhook: raw body + `constructEvent` + secret Connect.
- Idempotência: `stripe_connect_webhook_events`.
- Preço só no backend; isolamento `firm_id`.
- Sem PAN no Teglion; sem `application_fee` nesta v1.

---

## Entitlements

`entitlements.can(firmId, 'payments.online')` está em modo **open**. Mais tarde: planos/add-ons sem `if (plan === …)` espalhado.
