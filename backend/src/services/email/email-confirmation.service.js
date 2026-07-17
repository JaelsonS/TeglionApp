/**
 * Confirmação de e-mail para firm_users (dono e equipa).
 */
const crypto = require('crypto');
const emailConfirmationRepository = require('../../db/supabase/repositories/email-confirmation.repository');
const {
  notifyFirmStaffEmailConfirmation,
  notifyFirmOwnerSignupConfirm,
} = require('../notifications/contabil-notifications.service');

const EMAIL_CONFIRM_TTL_HOURS = 48;

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/**
 * @param {{ userId: string, email: string, fullName?: string, firmName?: string, variant?: 'owner' | 'staff' }} opts
 */
async function issueAndSendFirmUserEmailConfirmation({
  userId,
  email,
  fullName,
  firmName,
  variant = 'staff',
}) {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_CONFIRM_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await emailConfirmationRepository.invalidateUserTokens('firm_user', userId);
  await emailConfirmationRepository.createToken({
    userType: 'firm_user',
    userId,
    tokenHash,
    expiresAt,
  });

  try {
    const delivery =
      variant === 'owner'
        ? await notifyFirmOwnerSignupConfirm({
            ownerEmail: email,
            ownerName: fullName,
            firmName,
            token: rawToken,
          })
        : await notifyFirmStaffEmailConfirmation({
            staffEmail: email,
            staffName: fullName,
            firmName,
            token: rawToken,
          });

    if (delivery?.skipped) {
      return { emailSent: false, emailError: 'email_disabled', expiresAt };
    }
    return { emailSent: true, emailError: null, expiresAt };
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || 'email_delivery_failed';
    return { emailSent: false, emailError: String(message), expiresAt };
  }
}

module.exports = {
  issueAndSendFirmUserEmailConfirmation,
  generateToken,
  hashToken,
  EMAIL_CONFIRM_TTL_HOURS,
};
