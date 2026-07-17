/**
 * Store partilhado para express-rate-limit (Redis em produção, memória em dev).
 * Só activa Redis após probe com sucesso; se falhar, usa in-memory sem erros no arranque.
 *
 * Upstash (rediss://) requer TLS + preferência IPv4 em alguns hosts (ex. Render).
 */
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const { env } = require('../config/env');
const { logger } = require('./logger');

const REDIS_PROBE_MS = 8_000;

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

function redisClientOptions() {
  return {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 2,
    connectTimeout: REDIS_PROBE_MS,
    // Upstash + Render: TLS explícito e IPv4 evitam falhas intermitentes
    tls: {},
    family: 4,
    keepAlive: 10_000,
    retryStrategy(times) {
      if (times > 8) return null;
      return Math.min(times * 400, 3_000);
    },
  };
}

function markRedisUnavailable(reason) {
  redisVerified = false;
  logger.warn('[rate-limit] Redis indisponível — limites em fail-open (pedidos não bloqueados)', {
    message: reason?.message || String(reason || 'unknown'),
  });
}

function attachRedisListeners(client) {
  client.on('error', (err) => {
    // Não desactivar em erros transitórios se o cliente ainda vai reconectar
    if (client.status === 'end' || client.status === 'close') {
      markRedisUnavailable(err);
    }
    logger.error('[redis] rate-limit client error', { message: err?.message, status: client.status });
  });
  client.on('close', () => {
    // close dispara também em quit/shutdown — só marcar se for o cliente partilhado activo
    if (client === redisClient) {
      redisVerified = false;
      logger.warn('[redis] conexão fechada — a tentar reconectar automaticamente');
    }
  });
  client.on('ready', () => {
    if (client === redisClient) {
      redisVerified = true;
      logger.info('[redis] rate-limit store pronto.');
    }
  });
  client.on('connect', () => {
    if (client === redisClient) {
      logger.info('[redis] rate-limit store ligado.');
    }
  });
}

function createRedisClient(url) {
  const client = new Redis(url, redisClientOptions());
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
    // Cliente de probe sem listeners globais (quit() não deve “matar” o estado partilhado)
    probeClient = new Redis(url, {
      ...redisClientOptions(),
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });
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

  if (!/^rediss?:\/\//i.test(url)) {
    logger.warn('[rate-limit] REDIS_URL inválida — esperado redis:// ou rediss://');
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
    const pong = await redisClient.ping();
    if (pong !== 'PONG') {
      throw new Error(`PING inesperado: ${pong}`);
    }
    redisVerified = true;
    logger.info('[rate-limit] Redis verificado — store partilhado activo.');
    return true;
  } catch (err) {
    markRedisUnavailable(err);
    try {
      await redisClient.quit();
    } catch {
      // ignore
    }
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
    const closing = redisClient;
    redisClient = null;
    await closing.quit().catch(() => {});
  }
}

module.exports = {
  initRateLimitRedis,
  createRateLimitStore,
  closeRateLimitRedis,
  failOpenRedisResponse,
  getSharedRedisClient: () => (redisVerified && redisClient ? redisClient : null),
};
