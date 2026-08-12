const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');
const { getStripe, isStripeConnectConfigured } = require('../../services/stripe/stripe-client');
const entitlements = require('../entitlements/entitlements.service');
const connectAccountsRepository = require('../../db/supabase/repositories/firm-stripe-connect-accounts.repository');
const firmPaymentsRepository = require('../../db/supabase/repositories/firm-payments.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const bookingService = require('../booking/booking.service');
const { logger } = require('../../utils/logger');
const { computePlatformFeeCents, getPlatformFeePercentLabel } = require('./connect-fees');

const HOLD_MINUTES = 30;

function holdExpiresAtDate(from = new Date()) {
  return new Date(from.getTime() + HOLD_MINUTES * 60 * 1000);
}

async function assertConnectReadyForCharges(firmId) {
  if (!isStripeConnectConfigured()) {
    throw new AppError(
      'Pagamentos online não estão activos neste ambiente.',
      503,
      { code: 'STRIPE_CONNECT_DISABLED' },
      'STRIPE_CONNECT_DISABLED',
    );
  }
  const entitlement = await entitlements.can(firmId, 'payments.online');
  if (!entitlement.allowed) {
    throw new AppError(
      'Pagamentos online não estão incluídos no seu plano.',
      403,
      { code: 'ENTITLEMENT_DENIED' },
      'ENTITLEMENT_DENIED',
    );
  }
  const account = await connectAccountsRepository.findByFirmId(firmId);
  if (!account?.chargesEnabled || !account.stripeAccountId) {
    throw new AppError(
      'O escritório ainda não tem Stripe Connect pronto a receber pagamentos.',
      409,
      { code: 'CONNECT_NOT_READY' },
      'CONNECT_NOT_READY',
    );
  }
  return account;
}

/**
 * Reserva PENDING_PAYMENT + cria Checkout Session (direct charge na connected account).
 * Preço sempre do serviço no DB (snapshot). Sem sync Google até SCHEDULED.
 */
async function bookAndPayAsClient({
  firmId,
  clientId,
  leadId,
  serviceId,
  scheduledAt,
  firmSlug,
  serviceSlug,
  customerEmail,
  customerName,
}) {
  if (Boolean(clientId) === Boolean(leadId)) {
    throw new AppError('Indique exactamente um titular (cliente ou lead)', 400);
  }

  const service = await accountingServicesRepository.findByIdForFirm(serviceId, firmId);
  if (!service || !service.isActive) throw new AppError('Serviço não encontrado', 404);
  if (!service.paymentRequired) {
    throw new AppError('Este serviço não exige pagamento online', 400, { code: 'PAYMENT_NOT_REQUIRED' });
  }
  if (!service.requiresBooking) {
    throw new AppError('Serviço sem agendamento', 400);
  }

  const amountCents = Number(service.priceCents);
  if (!Number.isFinite(amountCents) || amountCents < 1) {
    throw new AppError('Serviço pago sem preço válido', 400, { code: 'INVALID_PRICE' });
  }
  const currency = String(service.currency || 'EUR').toLowerCase();

  const connectAccount = await assertConnectReadyForCharges(firmId);

  const startMs = new Date(scheduledAt).getTime();
  if (!Number.isFinite(startMs)) throw new AppError('Data inválida', 400);

  const { slots, booking } = await bookingService.listSlotsForBooking({
    firmId,
    serviceId,
    fromIso: new Date(startMs - 120 * 1000).toISOString(),
    toIso: new Date(startMs + 120 * 1000).toISOString(),
  });
  const match = slots.some((iso) => Math.abs(new Date(iso).getTime() - startMs) <= 90 * 1000);
  if (!match) throw new AppError('Este horário já não está disponível', 409);

  const firm = await firmsRepository.findFirmById(firmId);
  const firmBooking = bookingService.normalizeBooking(firm?.settings?.booking || {});
  const publicStaffId = firmBooking.googleCalendarStaffUserId || null;

  const expiresAt = holdExpiresAtDate();
  const expiresUnix = Math.floor(expiresAt.getTime() / 1000);

  const consultation = await consultationsRepository.createConsultation({
    firmId,
    clientId: clientId || null,
    leadId: leadId || null,
    staffId: publicStaffId,
    title: service.name,
    scheduledAt: new Date(startMs).toISOString(),
    durationMinutes: service.durationMinutes,
    notes: null,
    status: 'PENDING_PAYMENT',
    accountingServiceId: service.id,
    priceCents: amountCents,
    currency: service.currency || 'EUR',
    source: 'CLIENT',
    holdExpiresAt: expiresAt.toISOString(),
  });

  const publicStatusToken = firmPaymentsRepository.newPublicStatusToken();
  const platformFeeCents = computePlatformFeeCents(amountCents);
  let payment = await firmPaymentsRepository.insertPayment({
    firmId,
    purpose: 'booking',
    referenceType: 'consultation',
    referenceId: consultation.id,
    amountCents,
    currency: (service.currency || 'EUR').toUpperCase(),
    status: 'pending',
    stripeAccountId: connectAccount.stripeAccountId,
    checkoutExpiresAt: expiresAt.toISOString(),
    publicStatusToken,
    metadata: {
      serviceId: service.id,
      serviceName: service.name,
      scheduledAt: consultation.scheduledAt,
      platformFeeCents,
      platformFeePercent: getPlatformFeePercentLabel(),
    },
  });

  const stripe = getStripe();
  if (!stripe) {
    await expireHoldAndPayment({ firmId, consultation, payment, reason: 'stripe_unavailable' });
    throw new AppError('Stripe não configurado', 503, undefined, 'STRIPE_NOT_CONFIGURED');
  }

  const base = env.FRONTEND_URL.replace(/\/+$/, '');
  const slugFirm = encodeURIComponent(firmSlug || firm?.slug || firmId);
  const successUrl =
    `${base}/${slugFirm}/booking/return` +
    `?c=${encodeURIComponent(consultation.id)}` +
    `&t=${encodeURIComponent(publicStatusToken)}` +
    `&status=success`;
  const cancelUrl =
    `${base}/${slugFirm}/booking/return` +
    `?c=${encodeURIComponent(consultation.id)}` +
    `&t=${encodeURIComponent(publicStatusToken)}` +
    `&status=cancelled` +
    (serviceSlug ? `&service=${encodeURIComponent(serviceSlug)}` : '');

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: customerEmail || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amountCents,
              product_data: {
                name: service.name,
                description: customerName
                  ? `Agendamento — ${customerName}`
                  : 'Agendamento via Teglion',
              },
            },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        expires_at: expiresUnix,
        metadata: {
          firmId: String(firmId),
          consultationId: String(consultation.id),
          paymentId: String(payment.id),
          purpose: 'booking',
          platform: 'teglion',
          platformFeeCents: String(platformFeeCents),
        },
        payment_intent_data: {
          ...(platformFeeCents > 0 ? { application_fee_amount: platformFeeCents } : {}),
          metadata: {
            firmId: String(firmId),
            consultationId: String(consultation.id),
            paymentId: String(payment.id),
            purpose: 'booking',
            platformFeeCents: String(platformFeeCents),
          },
        },
      },
      { stripeAccount: connectAccount.stripeAccountId },
    );
  } catch (err) {
    logger.error('[connect-payments] checkout create failed', {
      firmId,
      message: err?.message,
    });
    await expireHoldAndPayment({
      firmId,
      consultation,
      payment,
      reason: 'checkout_create_failed',
    });
    throw new AppError(
      'Não foi possível iniciar o pagamento. Tente outro horário.',
      502,
      { code: 'CHECKOUT_CREATE_FAILED' },
      'CHECKOUT_CREATE_FAILED',
    );
  }

  payment = await firmPaymentsRepository.updatePayment(payment.id, firmId, {
    stripeCheckoutSessionId: session.id,
  });

  return {
    consultation,
    payment,
    checkoutUrl: session.url,
    publicStatusToken,
    holdExpiresAt: expiresAt.toISOString(),
  };
}

async function expireHoldAndPayment({ firmId, consultation, payment, reason }) {
  if (consultation?.id && consultation.status === 'PENDING_PAYMENT') {
    await consultationsRepository.updateConsultation(consultation.id, firmId, {
      status: 'CANCELLED',
      cancelReason: reason || 'payment_expired',
      holdExpiresAt: null,
    });
  }
  if (payment?.id && payment.status === 'pending') {
    await firmPaymentsRepository.updatePayment(payment.id, firmId, {
      status: reason === 'checkout_create_failed' || reason === 'stripe_unavailable' ? 'failed' : 'expired',
      failedAt: new Date().toISOString(),
    });
  }
}

/**
 * Webhook: Checkout pago → payment paid + consultation SCHEDULED + Google sync.
 */
async function confirmPaidCheckoutSession(session) {
  const paymentId = session?.metadata?.paymentId;
  const firmIdMeta = session?.metadata?.firmId;
  const consultationIdMeta = session?.metadata?.consultationId;

  let payment = session?.id
    ? await firmPaymentsRepository.findByCheckoutSessionId(session.id)
    : null;
  if (!payment && paymentId && firmIdMeta) {
    payment = await firmPaymentsRepository.findByIdForFirm(paymentId, firmIdMeta);
  }
  if (!payment) {
    logger.info('[connect-payments] checkout.completed sem payment local', {
      sessionId: session?.id,
    });
    return { ok: false, reason: 'payment_not_found' };
  }

  const firmId = payment.firmId;
  if (firmIdMeta && String(firmIdMeta) !== String(firmId)) {
    logger.warn('[connect-payments] firmId metadata mismatch', { firmId, firmIdMeta });
    return { ok: false, reason: 'firm_mismatch' };
  }

  if (payment.status === 'paid') {
    return { ok: true, reason: 'already_paid', payment };
  }

  if (payment.status !== 'pending') {
    logger.warn('[connect-payments] checkout.completed em status inesperado', {
      paymentId: payment.id,
      status: payment.status,
    });
    return { ok: false, reason: 'unexpected_status' };
  }

  const amountTotal = Number(session.amount_total);
  if (Number.isFinite(amountTotal) && amountTotal !== payment.amountCents) {
    logger.error('[connect-payments] amount mismatch', {
      paymentId: payment.id,
      expected: payment.amountCents,
      got: amountTotal,
    });
    return { ok: false, reason: 'amount_mismatch' };
  }

  const consultationId = consultationIdMeta || payment.referenceId;
  const consultation = await consultationsRepository.findByIdForFirm(consultationId, firmId);
  if (!consultation) {
    return { ok: false, reason: 'consultation_not_found' };
  }

  if (consultation.status === 'CANCELLED') {
    // Pago depois do hold expirado — não reabrir automaticamente; marca paid + anomalia
    await firmPaymentsRepository.updatePayment(payment.id, firmId, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      stripePaymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || payment.stripePaymentIntentId,
      metadata: {
        ...(payment.metadata || {}),
        anomaly: 'paid_after_hold_cancelled',
        sessionId: session.id,
      },
    });
    logger.warn('[connect-payments] pago após hold cancelado — requer atenção ops', {
      paymentId: payment.id,
      consultationId,
    });
    return { ok: true, reason: 'paid_after_cancel_anomaly' };
  }

  await firmPaymentsRepository.updatePayment(payment.id, firmId, {
    status: 'paid',
    paidAt: new Date().toISOString(),
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
  });

  const updated = await consultationsRepository.updateConsultation(consultation.id, firmId, {
    status: 'SCHEDULED',
    holdExpiresAt: null,
    cancelReason: null,
  });

  // Google Calendar só depois de confirmado
  void syncConfirmedConsultation(firmId, updated).catch(() => {});

  return { ok: true, reason: 'confirmed', payment, consultation: updated };
}

async function syncConfirmedConsultation(firmId, consultation) {
  if (!consultation || consultation.status !== 'SCHEDULED' || !consultation.staffId) return;
  const firm = await firmsRepository.findFirmById(firmId);
  const tz = firm?.settings?.booking?.timezone || 'Europe/Lisbon';
  const googleCalendarSyncService = require('../integrations/google-calendar/google-calendar-sync.service');
  const leadsRepository = require('../../db/supabase/repositories/leads.repository');
  const clientsRepository = require('../../db/supabase/repositories/clients.repository');
  let requesterName = null;
  if (consultation.leadId) {
    const lead = await leadsRepository.findByIdForFirm(consultation.leadId, firmId);
    requesterName = lead?.name || null;
  } else if (consultation.clientId) {
    const client = await clientsRepository.findClientById(firmId, consultation.clientId);
    requesterName = client?.displayName || client?.name || null;
  }
  await googleCalendarSyncService.syncConsultationToGoogle({
    firmId,
    consultation,
    requesterName,
    timeZone: tz,
  });
}

async function handleCheckoutExpired(session) {
  const payment = session?.id
    ? await firmPaymentsRepository.findByCheckoutSessionId(session.id)
    : null;
  if (!payment) return { ok: false, reason: 'not_found' };
  if (payment.status !== 'pending') return { ok: true, reason: 'noop' };

  const consultation = await consultationsRepository.findByIdForFirm(payment.referenceId, payment.firmId);
  await expireHoldAndPayment({
    firmId: payment.firmId,
    consultation: consultation?.status === 'PENDING_PAYMENT' ? consultation : null,
    payment,
    reason: 'payment_expired',
  });
  return { ok: true, reason: 'expired' };
}

async function handleChargeRefunded(charge) {
  const pi =
    typeof charge?.payment_intent === 'string'
      ? charge.payment_intent
      : charge?.payment_intent?.id;
  if (!pi) return { ok: false };

  // Lookup by payment_intent — scan via metadata if needed; simple path: find by session not available
  // Store payment_intent on payment row — query
  const { getSupabaseAdmin } = require('../../db/supabase/client');
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_payments')
    .select('*')
    .eq('stripe_payment_intent_id', pi)
    .maybeSingle();
  if (error || !data) return { ok: false, reason: 'not_found' };
  const payment = firmPaymentsRepository.mapRow(data);
  if (payment.status === 'refunded') return { ok: true, reason: 'already' };
  await firmPaymentsRepository.updatePayment(payment.id, payment.firmId, {
    status: 'refunded',
  });
  // Booking stays SCHEDULED in v1 — firm manages cancellation manually
  return { ok: true, reason: 'refunded', payment };
}

async function getPublicPaymentStatus({ consultationId, token }) {
  const payment = await firmPaymentsRepository.findByPublicToken(token);
  if (!payment || String(payment.referenceId) !== String(consultationId)) {
    throw new AppError('Pedido não encontrado', 404, { code: 'NOT_FOUND' });
  }
  const consultation = await consultationsRepository.findByIdForFirm(
    payment.referenceId,
    payment.firmId,
  );
  return {
    paymentStatus: payment.status,
    bookingStatus: consultation?.status || null,
    scheduledAt: consultation?.scheduledAt || null,
    amountCents: payment.amountCents,
    currency: payment.currency,
    holdExpiresAt: consultation?.holdExpiresAt || payment.checkoutExpiresAt,
    confirmed: payment.status === 'paid' && consultation?.status === 'SCHEDULED',
  };
}

async function expireDueHolds() {
  const nowIso = new Date().toISOString();
  const payments = await firmPaymentsRepository.listExpiredPending({ beforeIso: nowIso, limit: 40 });
  let n = 0;
  for (const payment of payments) {
    try {
      const consultation = await consultationsRepository.findByIdForFirm(
        payment.referenceId,
        payment.firmId,
      );
      await expireHoldAndPayment({
        firmId: payment.firmId,
        consultation: consultation?.status === 'PENDING_PAYMENT' ? consultation : null,
        payment,
        reason: 'payment_expired',
      });
      n += 1;
    } catch (err) {
      logger.warn('[connect-payments] expire hold failed', {
        paymentId: payment.id,
        message: err?.message,
      });
    }
  }

  const holds = await consultationsRepository.listExpiredPaymentHolds({ beforeIso: nowIso, limit: 40 });
  for (const c of holds) {
    try {
      await consultationsRepository.updateConsultation(c.id, c.firmId, {
        status: 'CANCELLED',
        cancelReason: 'payment_expired',
        holdExpiresAt: null,
      });
      n += 1;
    } catch (err) {
      logger.warn('[connect-payments] expire consultation hold failed', {
        consultationId: c.id,
        message: err?.message,
      });
    }
  }
  return { expired: n };
}

module.exports = {
  HOLD_MINUTES,
  bookAndPayAsClient,
  confirmPaidCheckoutSession,
  handleCheckoutExpired,
  handleChargeRefunded,
  getPublicPaymentStatus,
  expireDueHolds,
  assertConnectReadyForCharges,
};
