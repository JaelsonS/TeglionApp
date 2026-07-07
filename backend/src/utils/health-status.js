const { env } = require('../config/env');
const { isSupabaseConfigured, getSupabaseAdmin } = require('../db/supabase/client');
const { getSharedRedisClient } = require('./rate-limit-store');

async function buildHealthPayload() {
  const nodeEnv = env.NODE_ENV || 'development';
  const productMode = env.PRODUCT_MODE || 'contabil';
  const isProd = nodeEnv === 'production';

  const base = {
    status: 'unhealthy',
    service: 'contabil-backend',
    timestamp: new Date().toISOString(),
    ...(isProd ? {} : { productMode, environment: nodeEnv, version: process.env.npm_package_version || '2.0.0' }),
    database: isProd ? undefined : { driver: 'supabase', state: 'disconnected', pingOk: false },
  };

  if (!isSupabaseConfigured()) {
    if (!isProd) base.reason = 'Supabase not configured';
    return { httpStatus: 503, body: base };
  }

  const client = getSupabaseAdmin();
  if (!client) {
    if (!isProd) base.reason = 'Supabase client failed to initialize';
    return { httpStatus: 503, body: base };
  }

  try {
    const { error } = await client.from('firms').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      if (!isProd) {
        base.database = { driver: 'supabase', state: 'disconnected', pingOk: false, pingError: error.message };
        base.reason = 'Supabase ping failed';
      }
      return { httpStatus: 503, body: base };
    }
    base.status = 'healthy';
    if (!isProd) {
      base.database = { driver: 'supabase', state: 'connected', pingOk: true };
      base.redis = { connected: Boolean(getSharedRedisClient()) };
      base.uptimeSeconds = Math.round(process.uptime());
    }
    return { httpStatus: 200, body: base };
  } catch (err) {
    if (!isProd) {
      base.reason = 'Supabase ping exception';
      base.database = {
        driver: 'supabase',
        state: 'disconnected',
        pingOk: false,
        pingError: err?.message || String(err),
      };
    }
    return { httpStatus: 503, body: base };
  }
}

module.exports = { buildHealthPayload };
