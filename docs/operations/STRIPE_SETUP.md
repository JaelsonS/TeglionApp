# Stripe — como configurar o TegLion (mensal + anual)

Guia prático para ti, com a Stripe aberta ao lado.  
**Última actualização:** 17 Julho 2026

## O que vamos vender

| Plano | O que o cliente vê | O que cobras na Stripe |
|-------|--------------------|------------------------|
| **Teste** | 14 dias grátis, sem cartão | Nada (é interno no TegLion) |
| **Mensal** | 35 € / mês | Recurring **35,00 EUR** / month |
| **Anual** | 29,99 €/mês (equiv.) | Recurring **359,88 EUR** / year |

Regra: site, app e Stripe têm de bater certo. O teste de **14 dias** continua como está (criado no registo, sem cartão).

---

## Passo a passo na Stripe (Test mode primeiro)

### 1. Produto

1. Abre [dashboard.stripe.com](https://dashboard.stripe.com) → **Test mode** ligado.
2. **Product catalog** → **Add product**.
3. Nome: `TegLion — Plano Escritório`.
4. Descrição (opcional): `Software para o escritório de contabilidade · portal do cliente incluído`.

### 2. Dois preços no mesmo produto

**Preço A — Mensal**
- Recurring → **Monthly**
- Amount: **35,00 EUR**
- Copia o Price ID (`price_…`) → vai para `STRIPE_PRICE_ID_EUR_MONTHLY`

**Preço B — Anual**
- No mesmo produto → **Add another price**
- Recurring → **Yearly**
- Amount: **359,88 EUR**
- Copia o Price ID → `STRIPE_PRICE_ID_EUR_YEARLY`

Dica: podes deixar o mensal como “default” no catálogo; o app escolhe pelo botão (mensal vs anual).

### 3. Chaves API

**Developers → API keys**
- Secret key (`sk_test_…` agora, `sk_live_…` em produção) → `STRIPE_SECRET_KEY` no Render
- Nunca coloques a secret no frontend

### 4. Webhook

**Developers → Webhooks → Add endpoint**

URL produção:
```
https://teglionapp.onrender.com/api/public/stripe/webhook
```

Eventos:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Signing secret (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`

Para testar em local: Stripe CLI  
`stripe listen --forward-to localhost:PORT/api/public/stripe/webhook`

### 5. Customer portal (recomendado)

**Settings → Billing → Customer portal**  
Activa: cancelar, mudar método de pagamento, ver facturas.

### 6. Métodos de pagamento (PT)

**Settings → Payment methods** — cartão; Multibanco / MB WAY se quiseres (quando a conta estiver pronta para PT).

---

## Variáveis no Render (backend)

```env
STRIPE_SECRET_KEY=sk_test_...          # depois sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_EUR_MONTHLY=price_...  # 35,00 € / mês
STRIPE_PRICE_ID_EUR_YEARLY=price_...   # 359,88 € / ano
FRONTEND_URL=https://teglion.com
```

Compatibilidade: se ainda tiveres só `STRIPE_PRICE_ID_EUR`, o backend trata como **mensal**.

Opcional (só exibição):
```env
FIRM_PLAN_EUR_MONTHLY_CENTS=3500
FIRM_PLAN_EUR_YEARLY_CENTS=35988
```

---

## Como funciona no produto

1. Registo → escritório em **TRIAL** com `trial_ends_at` daqui a **14 dias** (sem Stripe).
2. Durante o teste: acesso total.
3. Em **Plano e subscrição** o dono escolhe **Activar mensal** ou **Activar anual** → Checkout Stripe.
4. Webhook marca o escritório **ACTIVE**.
5. Se o teste acabar sem plano → acesso limitado até pagar.
6. **Gerir no Stripe** abre o Customer Portal.

---

## Checklist quando fores a Live

- [ ] Mesmo produto com 2 preços (35 €/mês e 359,88 €/ano) em **Live mode**
- [ ] Webhook Live a apontar para a URL do Render
- [ ] Variáveis `sk_live_` + `whsec_` + dois `price_` no Render
- [ ] Teste real com valor baixo / cartão teu antes de vender
- [ ] Landing e billing mostram os mesmos números

---

## Teste rápido (Test mode)

Cartão: `4242 4242 4242 4242`  
Regista escritório → vai a Plano → Activar mensal ou anual → confirma no Supabase `firms.status = ACTIVE`.

Se o botão anual estiver desactivado, falta `STRIPE_PRICE_ID_EUR_YEARLY` no Render.
