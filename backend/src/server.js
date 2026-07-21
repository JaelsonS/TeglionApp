const { Sentry } = require('./instrument');
const crypto = require('crypto');
const { env } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { startContabilSchedulers, stopContabilSchedulers } = require('./modules/obligations/schedulers');
const { startTaskSchedulers, stopTaskSchedulers } = require('./modules/tasks/schedulers');
const { initRateLimitRedis, closeRateLimitRedis } = require('./utils/rate-limit-store');
const { startJobWorker, registerJobHandler } = require('./jobs/redis-queue');
const { processFirm } = require('./modules/obligations/schedulers/obligation-reminders.scheduler');
const { logger } = require('./utils/logger');

const SERVER_MESSAGES = {
  gracefulShutdownTimeout: 'Graceful shutdown timeout - forçando saída',
  shutdownSuccess: 'Servidor encerrado com sucesso',
  criticalShutdownError: 'Erro crítico no shutdown',
};

function serverMessage(key) {
  return SERVER_MESSAGES[key] || key;
}

let fatalErrorReported = false;

async function reportFatalError(err, origin) {
  if (fatalErrorReported) return;
  fatalErrorReported = true;

  if (!Sentry) return;

  try {
    Sentry.withScope((scope) => {
      scope.setTag('fatal_error.origin', origin);
      if (err && err.message) {
        scope.setExtra('fatal_error.message', err.message);
      }
      Sentry.captureException(err);
    });
    await Sentry.flush(2000);
  } catch {
    // Preserve existing logging and shutdown behavior even if flush fails.
  }
}

function exitAfterFlush(code) {
  setTimeout(() => process.exit(code), 2500).unref();
}

process.on('unhandledRejection', (reason) => {
  console.error('[Teglion] unhandledRejection:', reason);
  logger.error('Unhandled promise rejection', {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });

  const shouldExit = String(process.env.EXIT_ON_UNHANDLED_REJECTION || '').toLowerCase() === 'true';
  if (!shouldExit) return;

  const err = reason instanceof Error ? reason : new Error(`Unhandled promise rejection: ${String(reason)}`);
  void reportFatalError(err, 'unhandledRejection').finally(() => exitAfterFlush(1));
});

process.on('uncaughtException', (err) => {
  console.error('[Teglion] uncaughtException:', err);
  logger.error('Uncaught exception', { message: err?.message, stack: err?.stack });
  void reportFatalError(err, 'uncaughtException').finally(() => exitAfterFlush(1));
});

function runCryptoSelfTest() {
  if (!env.DATA_ENCRYPTION_KEY) return;
  let key;
  try {
    key = Buffer.from(env.DATA_ENCRYPTION_KEY, 'base64');
    if (key.length !== 32) return;
  } catch {
    if (!env.isProduction) {
      logger.warn('DATA_ENCRYPTION_KEY inválida — self-test ignorado em dev');
      return;
    }
    throw new Error('DATA_ENCRYPTION_KEY must be 32-byte base64 in production');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from('self-test', 'utf-8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');

  if (decrypted !== 'self-test') {
    throw new Error('CRYPTO_SELF_TEST_MISMATCH');
  }

  logger.info('CRYPTO_SELF_TEST_OK', {
    instanceId: process.env.RENDER_INSTANCE_ID || process.env.HOSTNAME || 'unknown',
  });
}

async function bootstrap() {
  try {
    runCryptoSelfTest();
    await connectDatabase();
    await initRateLimitRedis();

    const { app } = require('./app');

    const PORT = Number(process.env.PORT || env.PORT || 8001);

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Teglion API em http://0.0.0.0:${PORT}/api (Supabase)`);
    });

    startContabilSchedulers();
    startTaskSchedulers();

    registerJobHandler('obligation-reminders:firm', async ({ firmId }) => {
      await processFirm(firmId);
    });
    const stopJobWorker = startJobWorker();

    logger.info('PRODUCTION_READINESS_CHECK', {
      nodeEnv: env.NODE_ENV,
      productMode: env.PRODUCT_MODE,
      csrfEnabled: true,
      rateLimitingEnabled: true,
      emailEnabled: env.EMAIL_ENABLED === true,
      supabaseConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      maxUploadMb: env.MAX_FILE_SIZE,
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        logger.error(`Porta ${PORT} já está em uso. Finalize o processo e tente novamente.`);
        process.exit(1);
      }
      logger.error('Erro no servidor HTTP', { message: err?.message, code: err?.code, stack: err?.stack });
      process.exit(1);
    });

    const shutdown = async (signal) => {
      logger.info(`Recebido ${signal}. Iniciando graceful shutdown...`);

      const shutdownTimeout = setTimeout(() => {
        logger.error(serverMessage('gracefulShutdownTimeout'));
        process.exit(1);
      }, 25000);

      server.close(async () => {
        try {
          stopContabilSchedulers();
          stopTaskSchedulers();
          stopJobWorker();
          await closeRateLimitRedis();
          logger.info(serverMessage('shutdownSuccess'));
          clearTimeout(shutdownTimeout);
          process.exit(0);
        } catch (error) {
          logger.error('Erro ao encerrar recursos', { error: error.message });
          clearTimeout(shutdownTimeout);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[Teglion] Falha ao iniciar o servidor:', err);
    logger.error('Falha ao iniciar o servidor', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
      code: err?.code,
    });
    process.exit(1);
  }
}

bootstrap();
