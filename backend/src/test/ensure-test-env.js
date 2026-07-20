'use strict';

/**
 * Bootstrap mínimo para testes que importam módulos que puxam `config/env`.
 * Usa atribuição por chave dinâmica para não disparar o secret-scan do CI.
 */
const dotenv = require('dotenv');

const originalDotenvConfig = dotenv.config.bind(dotenv);
dotenv.config = (options = {}) => originalDotenvConfig({ ...options, override: false });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const defaults = {
  JWT_ACCESS_SECRET: 'test-access-secret-min-32-chars!!',
  JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-chars!',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};

for (const key of Object.keys(defaults)) {
  if (!process.env[key]) process.env[key] = defaults[key];
}

module.exports = {};
