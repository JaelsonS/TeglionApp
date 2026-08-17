/**
 * Expira holds PENDING_PAYMENT e firm_payments pending após 30 min.
 */
const { expireDueHolds } = require('../connect-payments.service');
const bookingService = require('../../booking/booking.service');
const { logger } = require('../../../utils/logger');

const INTERVAL_MS = 60 * 1000;
let timer = null;

async function runExpireOnce() {
  try {
    const result = await expireDueHolds();
    if (result?.expired > 0) {
      logger.info('[connect-payments] holds expirados', result);
    }
    const anonExpired = await bookingService.expireAnonymousHolds();
    if (anonExpired > 0) {
      logger.info('[booking] holds anónimos expirados', { expired: anonExpired });
    }
  } catch (err) {
    logger.warn('[connect-payments] scheduler expire failed', { message: err?.message });
  }
}

function startConnectPaymentSchedulers() {
  if (timer) return;
  void runExpireOnce();
  timer = setInterval(() => {
    void runExpireOnce();
  }, INTERVAL_MS);
  if (timer.unref) timer.unref();
}

function stopConnectPaymentSchedulers() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = {
  startConnectPaymentSchedulers,
  stopConnectPaymentSchedulers,
  runExpireOnce,
};
