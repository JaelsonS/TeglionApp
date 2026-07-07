/**
 * Cache TTL em memória com fallback Redis partilhado (quando disponível).
 */
const { getSharedRedisClient } = require('../rate-limit-store');

const memory = new Map();

function memoryGet(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key, value, ttlSeconds) {
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

async function get(key) {
  const redis = getSharedRedisClient();
  if (redis) {
    try {
      return await redis.get(`cache:${key}`);
    } catch {
      return memoryGet(key);
    }
  }
  return memoryGet(key);
}

async function set(key, value, ttlSeconds = 60) {
  const redis = getSharedRedisClient();
  if (redis) {
    try {
      await redis.set(`cache:${key}`, String(value), 'EX', ttlSeconds);
      return;
    } catch {
      // fallback memória
    }
  }
  memorySet(key, value, ttlSeconds);
}

async function getOrSet(key, ttlSeconds, factory) {
  const cached = await get(key);
  if (cached !== null && cached !== undefined) {
    try {
      return JSON.parse(cached);
    } catch {
      return cached;
    }
  }
  const value = await factory();
  await set(key, JSON.stringify(value), ttlSeconds);
  return value;
}

function clearMemory() {
  memory.clear();
}

module.exports = {
  get,
  set,
  getOrSet,
  clearMemory,
};
