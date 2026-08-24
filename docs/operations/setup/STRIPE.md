# Stripe — Billing SaaS (escritório paga o Teglion)

> Fonte: `docs/operations/STRIPE_SETUP.md` (pasta antiga, removida após esta consolidação). Editado para PT-BR, sem reescrita de conteúdo técnico. Última atualização do conteúdo-fonte: 17/07/2026.

Pra **pagamentos dos clientes do escritório** (Stripe Connect), fui documentar em [`STRIPE_CONNECT.md`](./STRIPE_CONNECT.md). Não misturo esse guia de Billing com aquele.

## O que vendo

| Plano | O que o cliente vê | O que é cobrado na Stripe |
|-------|--------------------|------------------------|
| **Teste** | 14 dias grátis, sem cartão | Nada (é interno no Teglion) |
| **Mensal** | 35 € / mês | Recurring **35,00 EUR** / mês |
| **Anual** | 29,99 €/mês (equivalente) | Recurring **359,88 EUR** / ano |

Regra que sigo: site, app e Stripe têm que bater certo. O teste de **14 dias** continua como está (criado no registro, sem cartão).

---

## Passo a passo na Stripe (Test mode primeiro)

Deixo aqui exatamente os passos que sigo quando preciso montar isso de novo.

### 1. Produto

1. Abro [dashboard.stripe.com](https://dashboard.stripe.com) → **Test mode** ligado.
2. **Product catalog** → **Add product**.
3. Nome: `Teglion — Plano Escritório`.
4. Descrição (opcional): `Software para o escritório de contabilidade · portal do cliente incluído`.

### 2. Dois preços no mesmo produto

**Preço A — Mensal**
- Recurring → **Monthly**
- Amount: **35,00 EUR**
- Copio o Price ID (`price_…`) → `STRIPE_PRICE_ID_EUR_MONTHLY`

**Preço B — Anual**
- No mesmo produto → **Add another price**
- Recurring → **Yearly**
- Amount: **359,88 EUR**
- Copio o Price ID → `STRIPE_PRICE_ID_EUR_YEARLY`

Dica que anoto pra mim: dá pra deixar o mensal como "default" no catálogo; o app escolhe pelo botão (mensal vs. anual).

### 3. Chaves API

**Developers → API keys**
- Secret key (`sk_test_…` agora, `sk_live_…` em produção) → `STRIPE_SECRET_KEY` no Render.
- Nunca coloco a secret no frontend.

### 4. Webhook

**Developers → Webhooks → Add endpoint**

URL de produção:
```
https://teglionapp.onrender.com/api/public/stripe/webhook
```

Eventos:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Signing secret (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`.

Pra testar localmente: Stripe CLI —
`stripe listen --forward-to localhost:PORT/api/public/stripe/webhook`

### 5. Customer portal (recomendado)

**Settings → Billing → Customer portal**
Ativo: cancelar, mudar método de pagamento, ver faturas.

### 6. Métodos de pagamento (PT)

**Settings → Payment methods** — cartão; Multibanco / MB WAY se eu quiser (quando a conta estiver pronta para PT).

---

## Variáveis no Render (backend)

```env
STRIPE_SECRET_KEY=sk_test_...          # depois sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_EUR_MONTHLY=price_...  # 35,00 € / mês
STRIPE_PRICE_ID_EUR_YEARLY=price_...   # 359,88 € / ano
FRONTEND_URL=https://teglion.com
```

Compatibilidade: se ainda existir só `STRIPE_PRICE_ID_EUR`, o backend trata como **mensal**.

Opcional (só exibição):
```env
FIRM_PLAN_EUR_MONTHLY_CENTS=3500
FIRM_PLAN_EUR_YEARLY_CENTS=35988
```

---

## Como funciona no produto

1. Registro → escritório em **TRIAL** com `trial_ends_at` daqui a **14 dias** (sem Stripe).
2. Durante o teste: acesso total.
3. Em **Plano e assinatura** o dono escolhe **Ativar mensal** ou **Ativar anual** → Checkout Stripe.
4. Webhook marca o escritório **ACTIVE**.
5. Se o teste acabar sem plano → acesso limitado até pagar.
6. **Gerenciar no Stripe** abre o Customer Portal.

---

## Checklist ao ir para Live

- [ ] Mesmo produto com 2 preços (35 €/mês e 359,88 €/ano) em **Live mode**
- [ ] Webhook Live apontando para a URL do Render
- [ ] Variáveis `sk_live_` + `whsec_` + dois `price_` no Render
- [ ] Teste real com valor baixo / cartão próprio antes de vender
- [ ] Landing e billing mostram os mesmos números

---

## Teste rápido (Test mode)

Cartão: `4242 4242 4242 4242`
Registro escritório → vou em Plano → Ativar mensal ou anual → confirmo no Supabase `firms.status = ACTIVE`.

Se o botão anual estiver desativado, falta `STRIPE_PRICE_ID_EUR_YEARLY` no Render.
