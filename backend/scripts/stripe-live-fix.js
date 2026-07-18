#!/usr/bin/env node
/**
 * Corrige 2 problemas encontrados na auditoria do Stripe em Live mode:
 *   1. O preço mensal ativo cobrava 29,99 € (equivalente do anual) em vez
 *      dos 35,00 €/mês anunciados no site — e não existia preço anual.
 *   2. O webhook endpoint apontava para um domínio inexistente
 *      (teglion.onrender.com, 404) em vez do backend real
 *      (teglionapp.onrender.com).
 *
 * Lê backend/.env (produção/live). Idempotente: seguro re-correr.
 *
 * Uso: node backend/scripts/stripe-live-fix.js
 */
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const Stripe = require('stripe');
const CURRENCY = 'eur';
const MONTHLY_CENTS = Number(process.env.FIRM_PLAN_EUR_MONTHLY_CENTS || 3500);
const YEARLY_CENTS = Number(process.env.FIRM_PLAN_EUR_YEARLY_CENTS || 35988);
const CORRECT_WEBHOOK_URL = 'https://teglionapp.onrender.com/api/public/stripe/webhook';
const WRONG_WEBHOOK_HOST = 'teglion.onrender.com';

async function fixPrices(stripe) {
  const legacyPriceId = process.env.STRIPE_PRICE_ID_EUR;
  if (!legacyPriceId) {
    console.log('⚠️  STRIPE_PRICE_ID_EUR não definido — a saltar correção de preços.');
    return;
  }

  const legacyPrice = await stripe.prices.retrieve(legacyPriceId, { expand: ['product'] });
  const product = legacyPrice.product;
  console.log(`Produto live: ${product.id} ("${product.name}")`);

  const existing = await stripe.prices.list({ product: product.id, active: true, limit: 100 });

  async function findOrCreate(interval, amountCents, label) {
    const match = existing.data.find(
      (p) => p.recurring?.interval === interval && p.unit_amount === amountCents && p.currency === CURRENCY,
    );
    if (match) {
      console.log(`✔ Preço ${label} já existe: ${match.id} (${(amountCents / 100).toFixed(2)} EUR/${interval})`);
      return match;
    }
    const created = await stripe.prices.create({
      product: product.id,
      currency: CURRENCY,
      unit_amount: amountCents,
      recurring: { interval },
      metadata: { app: 'teglion', role: 'firm_plan', interval },
    });
    console.log(`✚ Preço ${label} criado: ${created.id} (${(amountCents / 100).toFixed(2)} EUR/${interval})`);
    return created;
  }

  const monthly = await findOrCreate('month', MONTHLY_CENTS, 'Mensal');
  const yearly = await findOrCreate('year', YEARLY_CENTS, 'Anual');

  if (legacyPrice.unit_amount !== MONTHLY_CENTS && legacyPrice.active) {
    await stripe.prices.update(legacyPrice.id, { active: false });
    console.log(`✚ Preço antigo desativado: ${legacyPrice.id} (${(legacyPrice.unit_amount / 100).toFixed(2)} EUR/${legacyPrice.recurring?.interval}) — não afeta subscrições já existentes (não havia nenhuma).`);
  }

  console.log('\n──────────────────────────────────────────────');
  console.log('Atualiza estas variáveis no Render (produção) →');
  console.log('──────────────────────────────────────────────');
  console.log(`STRIPE_PRICE_ID_EUR_MONTHLY=${monthly.id}`);
  console.log(`STRIPE_PRICE_ID_EUR_YEARLY=${yearly.id}`);
  console.log('(podes remover STRIPE_PRICE_ID_EUR depois de confirmar que o mensal funciona)');
  console.log('──────────────────────────────────────────────\n');
}

async function fixWebhook(stripe) {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
  const wrong = endpoints.data.find((e) => e.url.includes(WRONG_WEBHOOK_HOST));
  if (!wrong) {
    console.log('✔ Nenhum webhook a apontar para o domínio errado — nada a corrigir.');
    return;
  }
  const updated = await stripe.webhookEndpoints.update(wrong.id, { url: CORRECT_WEBHOOK_URL });
  console.log(`✚ Webhook ${wrong.id} corrigido: ${wrong.url} → ${updated.url}`);
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
    console.error('❌ Este script destina-se ao ficheiro backend/.env com a chave LIVE. Abortando.');
    process.exit(1);
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  await fixPrices(stripe);
  await fixWebhook(stripe);
}

main().catch((err) => {
  console.error('❌ Falhou:', err.message || err);
  process.exit(1);
});
