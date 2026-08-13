/**
 * Sentry opcional para falhas de backup (sem secrets).
 */

const { redactSecrets, safeErrorMessage } = require('./redact');

async function reportBackupFailure({ dsn, error, context = {} }) {
  if (!dsn) return { sent: false, reason: 'no_dsn' };

  let Sentry;
  try {
    const mod = require('@sentry/node');
    Sentry = mod && mod.default ? mod.default : mod;
  } catch {
    return { sent: false, reason: 'sentry_unavailable' };
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'production',
      tracesSampleRate: 0,
      sendDefaultPii: false,
      beforeSend(event) {
        if (event.message) event.message = redactSecrets(event.message);
        if (event.exception?.values) {
          for (const ex of event.exception.values) {
            if (ex.value) ex.value = redactSecrets(ex.value);
          }
        }
        return event;
      },
    });

    Sentry.withScope((scope) => {
      scope.setTag('component', 'postgres-backup');
      scope.setTag('stage', String(context.stage || 'unknown'));
      if (context.backupId) scope.setTag('backupId', String(context.backupId));
      if (context.objectKey) scope.setExtra('objectKey', String(context.objectKey));
      if (context.durationMs != null) scope.setExtra('durationMs', context.durationMs);
      if (context.errorCode) scope.setTag('errorCode', String(context.errorCode));
      const err =
        error instanceof Error
          ? new Error(safeErrorMessage(error))
          : new Error(safeErrorMessage(error));
      if (error && error.code) err.code = error.code;
      Sentry.captureException(err);
    });

    await Sentry.flush(3000);
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: safeErrorMessage(err) };
  }
}

module.exports = { reportBackupFailure };
