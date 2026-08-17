/**
 * Actions Turnstile — devem coincidir com o atributo `action` do widget no frontend.
 */
const TURNSTILE_ACTIONS = Object.freeze({
  LOGIN_FIRM: 'login-firm',
  LOGIN_CLIENT: 'login-client',
  RECOVER: 'recover',
  RESET_PASSWORD: 'reset-password',
  REGISTER_FIRM: 'register-firm',
  REGISTER_FIRM_GOOGLE: 'register-firm-google',
  REGISTER_CLIENT_INVITE: 'register-client-invite',
  TEAM_INVITE_ACCEPT: 'team-invite-accept',
  INTAKE_LEAD: 'intake-lead',
  INTAKE_HOLD: 'intake-hold',
  INTAKE_SUBMIT: 'intake-submit',
  SUPPORT: 'support',
  NEWSLETTER: 'newsletter',
  PORTAL_UPLOAD: 'portal-upload',
  PORTAL_REPLY: 'portal-reply',
});

module.exports = { TURNSTILE_ACTIONS };
