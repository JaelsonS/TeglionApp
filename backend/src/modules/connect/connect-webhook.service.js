const connectAccountsService = require('./connect-accounts.service');
const connectPaymentsService = require('./connect-payments.service');
const connectWebhookEventsRepository = require('../../db/supabase/repositories/stripe-connect-webhook-events.repository');
const { logger } = require('../../utils/logger');

async function handleConnectWebhookEvent(event) {
  if (!event?.id) return;

  const claimed = await connectWebhookEventsRepository.claimWebhookEvent(event.id, event.type);
  if (!claimed) return;

  switch (event.type) {
    case 'account.updated': {
      const account = event.data?.object;
      await connectAccountsService.applyStripeAccountUpdate(account, { eventId: event.id });
      break;
    }
    case 'checkout.session.completed': {
      const session = event.data?.object;
      // Só processar pagamentos pagos (async payment methods podem vir unpaid)
      if (session?.payment_status === 'paid' || session?.status === 'complete') {
        await connectPaymentsService.confirmPaidCheckoutSession(session);
      }
      break;
    }
    case 'checkout.session.expired': {
      await connectPaymentsService.handleCheckoutExpired(event.data?.object);
      break;
    }
    case 'charge.refunded': {
      await connectPaymentsService.handleChargeRefunded(event.data?.object);
      break;
    }
    default:
      logger.info('[connect] webhook ignored', { type: event.type, eventId: event.id });
  }
}

module.exports = { handleConnectWebhookEvent };
