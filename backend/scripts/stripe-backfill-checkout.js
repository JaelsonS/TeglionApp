#!/usr/bin/env node
/**
 * Backfill manual: procura uma checkout session pelo ID, confirma que está
 * paga, e processa-a exactamente como o webhook faria (billingService.handleWebhookEvent).
 * Útil quando o `stripe listen` local falhou e o evento nunca chegou ao backend.
 *
 * Uso:
 *   node backend/scripts/stripe-backfill-checkout.js <checkoutSessionId>
 */
const { getStripe } = require('../src/services/stripe/stripe-client');
const billingService = require('../src/modules/billing/billing.service');

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('Uso: node scripts/stripe-backfill-checkout.js <checkoutSessionId>');
    process.exit(1);
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error('❌ Stripe não configurado (STRIPE_SECRET_KEY ausente).');
    process.exit(1);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  console.log(`Status do pagamento: ${session.payment_status}`);
  console.log(`Status da sessão: ${session.status}`);
  console.log(`firmId (metadata): ${session.metadata?.firmId || session.client_reference_id}`);
  console.log(`subscription: ${session.subscription}`);

  if (session.payment_status !== 'paid') {
    console.log('\n⚠️  Pagamento ainda não confirmado como "paid". Nada a sincronizar.');
    return;
  }

  await billingService.handleWebhookEvent({
    id: `evt_manual_backfill_${session.id}`,
    type: 'checkout.session.completed',
    data: { object: session },
  });

  console.log('\n✅ Sincronizado com sucesso (mesma lógica do webhook real).');
}

main().catch((err) => {
  console.error('❌ Falhou:', err.message || err);
  process.exit(1);
});
