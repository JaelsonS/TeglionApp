#!/usr/bin/env node
/**
 * Cria (ou reutiliza) o produto e os preços da Stripe exactamente como o
 * TegLion espera — mesmos valores que estão em backend/src/config/env.js
 * (FIRM_PLAN_EUR_MONTHLY_CENTS / FIRM_PLAN_EUR_YEARLY_CENTS) e que o
 * frontend mostra em pricingConstants.ts.
 *
 * Uso:
 *   STRIPE_SECRET_KEY=sk_test_... node backend/scripts/stripe-setup.js
 *   (ou define STRIPE_SECRET_KEY em backend/.env.local antes de correr)
 *
 * É idempotente: podes correr várias vezes que não duplica produto/preços.
 * Nunca cola a tua secret key no chat — exporta-a apenas no teu terminal.
 */
const Stripe = require('stripe');
const { env } = require('../src/config/env');

const PRODUCT_NAME = 'TegLion — Plano Escritório';
const PRODUCT_METADATA = { app: 'teglion', role: 'firm_plan' };
const CURRENCY = 'eur';

async function findOrCreateProduct(stripe) {
  const existing = await stripe.products.search({
    query: `active:'true' AND metadata['app']:'teglion' AND metadata['role']:'firm_plan'`,
  });
  if (existing.data.length > 0) {
    console.log(`✔ Produto já existe: ${existing.data[0].id} ("${existing.data[0].name}")`);
    return existing.data[0];
  }

  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: 'Software para o escritório de contabilidade · portal do cliente incluído',
    metadata: PRODUCT_METADATA,
  });
  console.log(`✚ Produto criado: ${product.id} ("${product.name}")`);
  return product;
}

async function findOrCreatePrice(stripe, product, { interval, amountCents, label }) {
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const match = prices.data.find(
    (p) =>
      p.recurring?.interval === interval &&
      p.unit_amount === amountCents &&
      p.currency === CURRENCY,
  );
  if (match) {
    console.log(`✔ Preço ${label} já existe: ${match.id} (${(amountCents / 100).toFixed(2)} ${CURRENCY.toUpperCase()}/${interval})`);
    return match;
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: CURRENCY,
    unit_amount: amountCents,
    recurring: { interval },
    metadata: { ...PRODUCT_METADATA, interval },
  });
  console.log(`✚ Preço ${label} criado: ${price.id} (${(amountCents / 100).toFixed(2)} ${CURRENCY.toUpperCase()}/${interval})`);
  return price;
}

async function main() {
  if (!env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não definido. Exporta-o no teu terminal ou define em backend/.env.local antes de correr este script.');
    process.exit(1);
  }

  const mode = env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST';
  console.log(`Modo Stripe: ${mode}\n`);

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const product = await findOrCreateProduct(stripe);

  const monthly = await findOrCreatePrice(stripe, product, {
    interval: 'month',
    amountCents: env.FIRM_PLAN_EUR_MONTHLY_CENTS,
    label: 'Mensal',
  });

  const yearly = await findOrCreatePrice(stripe, product, {
    interval: 'year',
    amountCents: env.FIRM_PLAN_EUR_YEARLY_CENTS,
    label: 'Anual',
  });

  console.log('\n──────────────────────────────────────────────');
  console.log('Cola isto no Render (ou backend/.env.local) →');
  console.log('──────────────────────────────────────────────');
  console.log(`STRIPE_PRICE_ID_EUR_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_ID_EUR_YEARLY=${yearly.id}`);
  console.log('──────────────────────────────────────────────');
  console.log(
    '\nFalta apenas (manual no Dashboard, não automatizável por API):\n' +
      '  1. Developers → API keys → copiar Secret key → STRIPE_SECRET_KEY\n' +
      '  2. Developers → Webhooks → Add endpoint → https://teglionapp.onrender.com/api/public/stripe/webhook\n' +
      '     eventos: checkout.session.completed, customer.subscription.updated,\n' +
      '              customer.subscription.deleted, invoice.payment_failed\n' +
      '     → copiar Signing secret → STRIPE_WEBHOOK_SECRET\n' +
      '  3. Settings → Billing → Customer portal → Activar (obrigatório 1x antes de usar em live mode)\n',
  );
}

main().catch((err) => {
  console.error('❌ Falhou:', err.message || err);
  process.exit(1);
});
