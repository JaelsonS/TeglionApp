
const { getSharedRedisClient } = require('../utils/rate-limit-store');
const { logger } = require('../utils/logger');

const QUEUE_KEY = 'teglion:jobs';
const handlers = new Map();

function registerJobHandler(name, fn) {
  handlers.set(name, fn);
}

async function enqueueJob(name, payload = {}) {
  const handler = handlers.get(name);
  if (!handler) {
    throw new Error(`Job handler não registado: ${name}`);
  }

  const redis = getSharedRedisClient();
  const job = JSON.stringify({ name, payload, enqueuedAt: Date.now() });

  if (redis) {
    try {
      await redis.lpush(QUEUE_KEY, job);
      return { queued: true };
    } catch (err) {
      logger.warn('[jobs] enqueue falhou — execução inline', { name, message: err?.message });
    }
  }

  await handler(payload);
  return { queued: false, ranInline: true };
}

async function processNextJob() {
  const redis = getSharedRedisClient();
  if (!redis) return false;

  let raw;
  try {
    raw = await redis.rpop(QUEUE_KEY);
  } catch (err) {
    logger.warn('[jobs] rpop falhou', { message: err?.message });
    return false;
  }
  if (!raw) return false;

  let job;
  try {
    job = JSON.parse(raw);
  } catch {
    logger.warn('[jobs] job JSON inválido');
    return true;
  }

  const handler = handlers.get(job.name);
  if (!handler) {
    logger.warn('[jobs] handler em falta', { name: job.name });
    return true;
  }

  try {
    await handler(job.payload);
  } catch (err) {
    logger.error('[jobs] job falhou', { name: job.name, message: err?.message });
  }
  return true;
}

function startJobWorker({ intervalMs = 2000 } = {}) {
  const timer = setInterval(() => {
    void processNextJob();
  }, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
}

module.exports = {
  registerJobHandler,
  enqueueJob,
  processNextJob,
  startJobWorker,
};
