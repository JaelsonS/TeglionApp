/**
 * Conexão primária — Supabase (única base de dados).
 */
const { env } = require('./env');
const { logger } = require('../utils/logger');
const { isSupabaseConfigured, getSupabaseAdmin } = require('../db/supabase/client');

let supabaseConnected = false;

async function connectDatabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      '[TegLion] Supabase não configurado.'
    );
  }

  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('[TegLion] Cliente Supabase não inicializado.');
  }

  const { error } = await client.from('firms').select('id').limit(1);
  if (error) {
    const acceptableErrorCodes = ['PGRST116', '42P01'];
    logger.warn('SUPABASE_PING', {
      message: error.message,
      code: error.code,
      hint: '[TegLion] Executar as migrações',
    });

    if (!acceptableErrorCodes.includes(error.code)) {
      throw new Error(
        `[TegLion] Supabase unreachable: ${error.message || error.code}`
      );
    }
  }

  supabaseConnected = true;
  logger.info('Supabase conectado (TegLion — primary DB)');
}

function isSupabasePrimary() {
  return supabaseConnected;
}

function getDesiredDbName() {
  return 'supabase';
}

module.exports = {
  connectDatabase,
  getDesiredDbName,
  isSupabasePrimary,
};
