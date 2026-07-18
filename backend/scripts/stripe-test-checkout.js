#!/usr/bin/env node
/**
 * Gera uma sessão de checkout Stripe para um firmId real, usando o mesmo
 * código de produção (billing.service.createCheckoutSession). Útil para
 * testar o fluxo de pagamento sem precisar de login na app.
 *
 * Uso:
 *   node backend/scripts/stripe-test-checkout.js <firmId> [month|year]
 */
const billingService = require('../src/modules/billing/billing.service');

async function main() {
  const firmId = process.argv[2];
  const interval = process.argv[3] === 'year' ? 'year' : 'month';
  if (!firmId) {
    console.error('Uso: node scripts/stripe-test-checkout.js <firmId> [month|year]');
    process.exit(1);
  }

  const data = await billingService.createCheckoutSession(firmId, 'teste@teglion.com', { interval });
  console.log(`\nInterval: ${data.interval}`);
  console.log(`Session ID: ${data.sessionId}`);
  console.log(`\nAbre este link no browser e paga com o cartão de teste 4242 4242 4242 4242:`);
  console.log(data.url);
}

main().catch((err) => {
  console.error('❌ Falhou:', err.message || err);
  process.exit(1);
});
