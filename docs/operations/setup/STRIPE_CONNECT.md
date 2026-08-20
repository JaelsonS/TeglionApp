# Stripe Connect — LIVE (dinheiro real)

> Fonte: `docs/operations/STRIPE_CONNECT_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico. "Definições → Pagamentos" abaixo é o texto real da navegação no produto (interface em PT-PT, porque o Teglion atende escritórios em Portugal) — não traduzido de propósito.

Pagamentos dos **clientes do escritório** → Connected Account Express. Separo isso do Billing SaaS ([`STRIPE.md`](./STRIPE.md)) de propósito, pra não misturar as duas coisas.

| Fluxo | Quem paga | Quem recebe | Webhook |
|-------|-----------|-------------|---------|
| **Billing** | Escritório → Teglion | Teglion | `/api/public/stripe/webhook` |
| **Connect** | Cliente → Escritório | Conta Stripe do escritório (− taxa Teglion) | `/api/public/stripe/connect/webhook` |

O Teglion **não custodia** dinheiro. Processamento: Stripe (Direct Charges). Em cada pagamento Connect, o Teglion retém uma **taxa de serviço da plataforma** (`application_fee_amount`, default **2%** via `STRIPE_CONNECT_PLATFORM_FEE_BPS=200`). As **taxas da Stripe** são cobradas pela Stripe diretamente à Connected Account, à parte. O escritório aceita a política em Definições → Pagamentos (IP, hora, versão + hash do texto).

**Não uso** a "Ferramenta de preços da plataforma" do Dashboard para essa taxa — com Direct Charges, o caminho correto é `application_fee_amount` no Checkout.

---

## Ativação LIVE (produção)

O código usa a mesma `STRIPE_SECRET_KEY` da plataforma. Em produção, precisa ser **`sk_live_…`**. Contas Express criadas com `sk_test_` **não servem** em live — o dono precisa reconectar o Connect em Definições.

### 1. Stripe Dashboard — modo **Live** (toggle Test desligado)

1. Vou em **Connect → Settings**: preencho perfil da plataforma, branding, website, suporte, país PT.
2. Completo os requisitos de plataforma Connect (a Stripe pode pedir informação do Teglion como plataforma).
3. **Developers → Webhooks → Add endpoint** (Live)
   - URL: `https://<API_PRODUÇÃO>/api/public/stripe/connect/webhook`
   - Listen to: **Events on Connected accounts**
   - Eventos:
     - `account.updated`
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `charge.refunded`
4. Copio o **Signing secret** (`whsec_…`) → `STRIPE_CONNECT_WEBHOOK_SECRET` no Render.
5. **Não** reutilizo o webhook de Billing para eventos Connect.

### 2. Variáveis no Render (backend produção)

| Variável | Valor live |
|----------|------------|
| `STRIPE_SECRET_KEY` | `sk_live_…` (plataforma) |
| `STRIPE_CONNECT_ENABLED` | `true` |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `whsec_…` do endpoint Connect **live** |
| `STRIPE_CONNECT_PLATFORM_FEE_BPS` | `200` (= 2% de taxa do Teglion; opcional, default 200) |
| `STRIPE_WEBHOOK_SECRET` | Continua o secret do webhook **Billing** live (outro endpoint) |
| `STRIPE_PRICE_ID_EUR_MONTHLY` / `YEARLY` | Price IDs **live** do plano Teglion |
| `FRONTEND_URL` | URL canônica da app (ex. `https://app.teglion.com`) |

Depois de salvar, faço o **redeploy** do backend.

### 3. Banco de dados

Aplico no Supabase **produção**:

- `20260925000000_firm_stripe_connect.sql`
- `20260926000000_firm_payments_booking_hold.sql`

### 4. Escritório (piloto)

1. Vou em Definições → **Pagamentos**, leio a política, aceito, e ligo o Stripe Connect (**KYC live**).
2. Espero o `charges_enabled` (webhook `account.updated`).
3. Deixo o serviço público com agendamento ligado + **Pagamento obrigatório** + preço > 0.
4. Faço **um pagamento real pequeno** (ex. 1,00 €) no link público e confirmo:
   - webhook → consulta `SCHEDULED`
   - dinheiro na Express do escritório
   - Google Calendar (se conectado)

### 5. Checklist GO Connect live

- [ ] Migrations Connect + payments aplicadas em produção
- [ ] `sk_live_` no Render (não `sk_test_`)
- [ ] `STRIPE_CONNECT_ENABLED=true`
- [ ] Webhook Connect live recebendo eventos (Dashboard → Webhooks → recent deliveries)
- [ ] Billing SaaS (mensalidade Teglion) continua com Price IDs live e o **seu próprio** webhook
- [ ] Dono completou onboarding Express live + aceite legal registrado
- [ ] Primeiro pagamento real de serviço OK
- [ ] Refunds: Dashboard Express do escritório (API refund depois)

---

## Fluxo de produto (já no código)

1. Hold `PENDING_PAYMENT` de 30 min + Checkout Session (direct charge + `application_fee_amount` do Teglion).
2. `checkout.session.completed` → `firm_payments.paid` + `SCHEDULED` → Calendar.
3. Expiração / `checkout.session.expired` → libera o horário.
4. Página `/:firmSlug/booking/return` é só UX; **pago só via webhook**.
5. Taxa do Teglion e taxas da Stripe descritas na política Connect (`connect_payment_responsibility_v2`).

---

## Segurança

- Segredos só no Render — nunca no Git.
- Webhook: raw body + `constructEvent` + secret Connect.
- Idempotência: `stripe_connect_webhook_events`.
- Preço só no backend; isolamento por `firm_id`.
- Sem PAN no Teglion; taxa de plataforma via `application_fee_amount` (não via Dashboard Platform Pricing Tool em Direct Charges).

---

## Entitlements

`entitlements.can(firmId, 'payments.online')` está em modo **open** hoje. Mais adiante, quero planos/add-ons sem `if (plan === …)` espalhado pelo código.
