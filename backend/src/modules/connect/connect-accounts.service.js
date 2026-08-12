const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');
const { getStripe, isStripeConnectConfigured } = require('../../services/stripe/stripe-client');
const entitlements = require('../entitlements/entitlements.service');
const connectAccountsRepository = require('../../db/supabase/repositories/firm-stripe-connect-accounts.repository');
const connectTermsRepository = require('../../db/supabase/repositories/firm-stripe-connect-terms.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const {
  CONNECT_TERMS_VERSION,
  connectTermsTextSha256,
  getConnectTermsPayload,
} = require('./connect-terms');
const {
  deriveOnboardingStatus,
  hasCurrentTermsAccepted,
  mapStripeAccountPatch,
} = require('./connect-access');
const { getPlatformFeePercentLabel } = require('./connect-fees');
const { logger } = require('../../utils/logger');

function assertConnectEnabled() {
  if (!isStripeConnectConfigured()) {
    throw new AppError(
      'Pagamentos online (Stripe Connect) não estão activos neste ambiente.',
      503,
      { code: 'STRIPE_CONNECT_DISABLED' },
      'STRIPE_CONNECT_DISABLED',
    );
  }
}

async function assertPaymentsOnlineEntitlement(firmId) {
  const result = await entitlements.can(firmId, 'payments.online');
  if (!result.allowed) {
    throw new AppError(
      'Pagamentos online não estão incluídos no seu plano.',
      403,
      { code: 'ENTITLEMENT_DENIED', feature: 'payments.online' },
      'ENTITLEMENT_DENIED',
    );
  }
  return result;
}

async function getConnectStatus(firmId, { isOwner = false } = {}) {
  const configured = isStripeConnectConfigured();
  const entitlement = await entitlements.can(firmId, 'payments.online');
  const terms = getConnectTermsPayload();
  const account = configured ? await connectAccountsRepository.findByFirmId(firmId) : null;

  return {
    configured,
    paymentsOnlineAllowed: entitlement.allowed,
    canStartOnboarding: Boolean(configured && entitlement.allowed && isOwner),
    platformFeePercent: getPlatformFeePercentLabel(),
    terms: {
      version: terms.version,
      title: terms.title,
      body: terms.body,
      sha256: terms.sha256,
      accepted: hasCurrentTermsAccepted(account),
      acceptedAt: account?.latestTermsAcceptedAt || null,
    },
    account: account
      ? {
          stripeAccountId: account.stripeAccountId,
          detailsSubmitted: account.detailsSubmitted,
          chargesEnabled: account.chargesEnabled,
          payoutsEnabled: account.payoutsEnabled,
          onboardingStatus: account.onboardingStatus,
          requirementsCurrentlyDue: account.requirementsCurrentlyDue,
          requirementsDisabledReason: account.requirementsDisabledReason,
          livemode: account.livemode,
          readyForCharges: account.chargesEnabled,
        }
      : null,
  };
}

async function ensureExpressAccount({ firmId, ownerUserId, ownerEmail, countryCode }) {
  const existing = await connectAccountsRepository.findByFirmId(firmId);
  if (existing) return existing;

  const stripe = getStripe();
  if (!stripe) {
    throw new AppError('Stripe não configurado', 503, undefined, 'STRIPE_NOT_CONFIGURED');
  }

  const country = String(countryCode || 'PT').toUpperCase().slice(0, 2) || 'PT';
  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email: ownerEmail || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      product_description: 'Serviços de contabilidade e consultoria fiscal',
    },
    metadata: {
      firmId: String(firmId),
      platform: 'teglion',
      purpose: 'firm_client_payments',
    },
  });

  try {
    return await connectAccountsRepository.insertAccount({
      firmId,
      stripeAccountId: account.id,
      livemode: Boolean(account.livemode),
      createdByUserId: ownerUserId,
      detailsSubmitted: Boolean(account.details_submitted),
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      onboardingStatus: deriveOnboardingStatus(account),
      requirementsCurrentlyDue: account.requirements?.currently_due || [],
      requirementsDisabledReason: account.requirements?.disabled_reason || null,
    });
  } catch (err) {
    // Corrida: outro pedido criou a linha — reutilizar.
    if (err?.code === '23505') {
      const again = await connectAccountsRepository.findByFirmId(firmId);
      if (again) return again;
    }
    logger.error('[connect] falha a gravar conta Express', { firmId, message: err?.message });
    throw err;
  }
}

async function createAccountLink(stripeAccountId, { refreshUrl, returnUrl }) {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
  return link.url;
}

/**
 * Exige aceite explícito da política no mesmo pedido (acceptedConnectTerms === true).
 * Grava aceite imutável (IP, UA, user, versão, hash) antes de criar Account Link.
 */
async function startOnboarding({
  firmId,
  ownerUserId,
  ownerEmail,
  ownerRole,
  acceptedConnectTerms,
  ipAddress,
  userAgent,
}) {
  assertConnectEnabled();
  await assertPaymentsOnlineEntitlement(firmId);

  if (ownerRole !== 'FIRM_OWNER') {
    throw new AppError(
      'Apenas o responsável (dono) do escritório pode ligar o Stripe Connect.',
      403,
      { code: 'FIRM_OWNER_REQUIRED' },
      'FIRM_OWNER_REQUIRED',
    );
  }

  if (acceptedConnectTerms !== true) {
    throw new AppError(
      'É necessário ler e aceitar a política de pagamentos online (Stripe Connect) para continuar.',
      400,
      { code: 'CONNECT_TERMS_REQUIRED' },
      'CONNECT_TERMS_REQUIRED',
    );
  }

  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);

  const termsSha = connectTermsTextSha256();
  const acceptance = await connectTermsRepository.insertAcceptance({
    firmId,
    firmUserId: ownerUserId,
    termsVersion: CONNECT_TERMS_VERSION,
    termsTextSha256: termsSha,
    ipAddress,
    userAgent,
  });

  const account = await ensureExpressAccount({
    firmId,
    ownerUserId,
    ownerEmail,
    countryCode: firm.countryCode || 'PT',
  });

  await connectAccountsRepository.updateByFirmId(firmId, {
    latestTermsVersion: CONNECT_TERMS_VERSION,
    latestTermsAcceptedAt: acceptance.acceptedAt,
    latestTermsAcceptedByUserId: ownerUserId,
  });

  const alreadyReady = Boolean(account.chargesEnabled);
  if (alreadyReady) {
    await auditRepository.writeAuditLog({
      firmId,
      actorRole: 'FIRM_OWNER',
      actorId: ownerUserId,
      action: 'stripe_connect.terms_accepted',
      entityType: 'firm_stripe_connect_account',
      entityId: account.id,
      metadata: {
        stripeAccountId: account.stripeAccountId,
        termsVersion: CONNECT_TERMS_VERSION,
        termsAcceptanceId: acceptance.id,
        termsSha256: termsSha,
        alreadyReady: true,
      },
      ipAddress,
    });
    return {
      url: null,
      alreadyReady: true,
      stripeAccountId: account.stripeAccountId,
      termsAcceptanceId: acceptance.id,
    };
  }

  const base = env.FRONTEND_URL.replace(/\/+$/, '');
  const returnUrl = `${base}/app/firm/settings?tab=pagamentos&connect=return`;
  const refreshUrl = `${base}/app/firm/settings?tab=pagamentos&connect=refresh`;
  const url = await createAccountLink(account.stripeAccountId, { returnUrl, refreshUrl });

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM_OWNER',
    actorId: ownerUserId,
    action: 'stripe_connect.onboarding_started',
    entityType: 'firm_stripe_connect_account',
    entityId: account.id,
    metadata: {
      stripeAccountId: account.stripeAccountId,
      termsVersion: CONNECT_TERMS_VERSION,
      termsAcceptanceId: acceptance.id,
      termsSha256: termsSha,
    },
    ipAddress,
  });

  return {
    url,
    alreadyReady: false,
    stripeAccountId: account.stripeAccountId,
    termsAcceptanceId: acceptance.id,
  };
}

async function refreshOnboardingLink({ firmId, ownerUserId, ownerRole, ipAddress }) {
  assertConnectEnabled();
  await assertPaymentsOnlineEntitlement(firmId);

  if (ownerRole !== 'FIRM_OWNER') {
    throw new AppError(
      'Apenas o responsável (dono) do escritório pode continuar a configuração Stripe.',
      403,
      { code: 'FIRM_OWNER_REQUIRED' },
      'FIRM_OWNER_REQUIRED',
    );
  }

  const account = await connectAccountsRepository.findByFirmId(firmId);
  if (!account) {
    throw new AppError(
      'Ainda não existe conta Stripe Connect. Inicie a ligação e aceite a política primeiro.',
      400,
      { code: 'CONNECT_NOT_STARTED' },
      'CONNECT_NOT_STARTED',
    );
  }

  if (!hasCurrentTermsAccepted(account)) {
    throw new AppError(
      'É necessário aceitar novamente a política de pagamentos online (versão actualizada).',
      400,
      { code: 'CONNECT_TERMS_REQUIRED' },
      'CONNECT_TERMS_REQUIRED',
    );
  }

  const base = env.FRONTEND_URL.replace(/\/+$/, '');
  const returnUrl = `${base}/app/firm/settings?tab=pagamentos&connect=return`;
  const refreshUrl = `${base}/app/firm/settings?tab=pagamentos&connect=refresh`;
  const url = await createAccountLink(account.stripeAccountId, { returnUrl, refreshUrl });

  await auditRepository.writeAuditLog({
    firmId,
    actorRole: 'FIRM_OWNER',
    actorId: ownerUserId,
    action: 'stripe_connect.onboarding_refreshed',
    entityType: 'firm_stripe_connect_account',
    entityId: account.id,
    metadata: { stripeAccountId: account.stripeAccountId },
    ipAddress,
  });

  return { url, stripeAccountId: account.stripeAccountId };
}

/**
 * Actualiza estado a partir do objecto Account Stripe (webhook ou retrieve).
 */
async function applyStripeAccountUpdate(stripeAccount, { eventId } = {}) {
  if (!stripeAccount?.id) return null;
  const row = await connectAccountsRepository.findByStripeAccountId(stripeAccount.id);
  if (!row) {
    logger.info('[connect] account.updated sem firm local', { stripeAccountId: stripeAccount.id });
    return null;
  }
  const patch = mapStripeAccountPatch(stripeAccount, eventId);
  return connectAccountsRepository.updateByFirmId(row.firmId, patch);
}

module.exports = {
  getConnectStatus,
  startOnboarding,
  refreshOnboardingLink,
  applyStripeAccountUpdate,
  deriveOnboardingStatus,
  hasCurrentTermsAccepted,
  CONNECT_TERMS_VERSION,
};
