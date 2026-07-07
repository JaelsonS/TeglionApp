/**
 * Store partilhado para express-rate-limit (Redis em produção, memória em dev).
 * Só activa Redis após probe com sucesso; se falhar, usa in-memory sem erros no arranque.
 */
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const { env } = require('../config/env');
const { logger } = require('./logger');

const REDIS_PROBE_MS = 5_000;

let redisClient = null;
let redisVerified = false;
let redisInitAttempted = false;

/** Respostas seguras quando Redis falha em runtime (fail-open: não bloqueia pedidos). */
function failOpenRedisResponse(args) {
  const cmd = String(args[0] || '').toUpperCase();
  if (cmd === 'EVALSHA' || cmd === 'EVAL') {
    return [1, 60_000];
  }
  if (cmd === 'SCRIPT' && String(args[1] || '').toUpperCase() === 'LOAD') {
    return 'teglion-fallback-sha';
  }
  switch (cmd) {
    case 'INCR':
      return 1;
    case 'DECR':
      return 0;
    case 'GET':
      return '0';
    case 'PTTL':
      return 60_000;
    case 'PEXPIRE':
    case 'DEL':
      return 1;
    default:
      return 0;
  }
}

function markRedisUnavailable(reason) {
  redisVerified = false;
  logger.warn('[rate-limit] Redis indisponível — limites em fail-open (pedidos não bloqueados)', {
    message: reason?.message || String(reason || 'unknown'),
  });
}

function attachRedisListeners(client) {
  client.on('error', (err) => {
    markRedisUnavailable(err);
    logger.error('[redis] rate-limit client error', { message: err?.message });
  });
  client.on('close', () => {
    markRedisUnavailable(new Error('Connection is closed'));
  });
  client.on('connect', () => {
    logger.info('[redis] rate-limit store ligado.');
  });
}

function createRedisClient(url) {
  const client = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: null,
    connectTimeout: REDIS_PROBE_MS,
    commandTimeout: REDIS_PROBE_MS,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 500, 2_000);
    },
  });
  attachRedisListeners(client);
  return client;
}

function safeSendCommand(...args) {
  if (!redisClient || !redisVerified) {
    return Promise.resolve(failOpenRedisResponse(args));
  }

  return redisClient.call(...args).catch((err) => {
    markRedisUnavailable(err);
    return failOpenRedisResponse(args);
  });
}

async function probeRedisUrl(url) {
  let probeClient;
  try {
    probeClient = createRedisClient(url);
    probeClient.removeAllListeners('error');
    probeClient.on('error', () => {});
    await probeClient.connect();
    const pong = await probeClient.ping();
    return pong === 'PONG';
  } catch (err) {
    logger.warn('[rate-limit] Probe Redis falhou — store in-memory', {
      message: err?.message,
    });
    return false;
  } finally {
    if (probeClient) {
      await probeClient.quit().catch(() => {});
    }
  }
}

/**
 * Deve correr antes de require('./app') para o rate-limit usar Redis só se estiver saudável.
 */
async function initRateLimitRedis() {
  if (redisInitAttempted) return redisVerified;
  redisInitAttempted = true;

  const url = String(env.REDIS_URL || '').trim();
  if (!url) {
    if (env.isProduction) {
      logger.warn(
        '[rate-limit] REDIS_URL ausente em produção — limites in-memory (não partilhados entre instâncias).',
      );
    } else {
      logger.info('[rate-limit] REDIS_URL ausente — store in-memory (dev).');
    }
    return false;
  }

  const ok = await probeRedisUrl(url);
  if (!ok) {
    redisVerified = false;
    return false;
  }

  redisClient = createRedisClient(url);
  try {
    await redisClient.connect();
    redisVerified = true;
    logger.info('[rate-limit] Redis verificado — store partilhado activo.');
    return true;
  } catch (err) {
    markRedisUnavailable(err);
    redisClient = null;
    return false;
  }
}

function createRateLimitStore(prefix = 'rl:') {
  if (!redisVerified || !redisClient) {
    return undefined;
  }

  return new RedisStore({
    sendCommand: safeSendCommand,
    prefix,
  });
}

async function closeRateLimitRedis() {
  redisVerified = false;
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
  }
}

module.exports = {
  initRateLimitRedis,
  createRateLimitStore,
  closeRateLimitRedis,
  failOpenRedisResponse,
  getSharedRedisClient: () => (redisVerified && redisClient ? redisClient : null),
};
